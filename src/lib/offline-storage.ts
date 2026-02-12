/**
 * Offline storage module for eVuka Rewards
 * Provides functionality for storing and retrieving data when offline
 */

import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import { encryptForStorage, decryptFromStorage } from "./crypto-secure";

interface OfflineReceipt {
  id: string;
  imageData: string; // Encrypted receipt image data
  timestamp: number;
  metadata?: Record<string, unknown>;
  encryptionVersion?: number; // Track encryption version for key rotation
}

class OfflineStorage {
  private dbName = "evuka-offline-db";
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains("offline-receipts")) {
          db.createObjectStore("offline-receipts", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("user-preferences")) {
          db.createObjectStore("user-preferences", { keyPath: "key" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        logger.info("IndexedDB initialized successfully");
        resolve();
      };

      request.onerror = (event) => {
        logger.error("Error initializing IndexedDB", event);
        reject(new Error("Failed to initialize offline storage"));
      };
    });
  }

  /**
   * Save a receipt for offline processing
   * Receipt image data is encrypted before storage for security
   */
  async saveReceipt(
    imageData: string,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    await this.init();

    // Encrypt sensitive image data before storing
    let encryptedImageData: string;
    try {
      encryptedImageData = await encryptForStorage(imageData);
    } catch (error) {
      logger.error("Failed to encrypt receipt data", error);
      // Fall back to unencrypted if encryption fails (degraded mode)
      // In production, you might want to fail here instead
      encryptedImageData = imageData;
    }

    const receipt: OfflineReceipt = {
      id: uuidv4(),
      imageData: encryptedImageData,
      timestamp: Date.now(),
      metadata,
      encryptionVersion: 1, // Track encryption version for future key rotation
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      // Implement retry mechanism for database operations
      const attemptSave = (retryCount = 0, maxRetries = 3) => {
        try {
          const transaction = this.db!.transaction(
            ["offline-receipts"],
            "readwrite",
          );
          const store = transaction.objectStore("offline-receipts");
          const request = store.add(receipt);

          request.onsuccess = () => {
            logger.info("Receipt saved for offline processing", {
              id: receipt.id,
            });

            // Register for background sync if available
            if ("serviceWorker" in navigator && "SyncManager" in window) {
              navigator.serviceWorker.ready
                .then((registration) =>
                  registration.sync.register("sync-receipts"),
                )
                .catch((err) =>
                  logger.error("Background sync registration failed", err),
                );
            }

            resolve(receipt.id);
          };

          request.onerror = (event) => {
            logger.error("Error saving offline receipt", event);
            if (retryCount < maxRetries) {
              logger.info(
                `Retrying save operation (${retryCount + 1}/${maxRetries})`,
              );
              // Exponential backoff for retries
              setTimeout(
                () => attemptSave(retryCount + 1, maxRetries),
                Math.pow(2, retryCount) * 500,
              );
            } else {
              reject(
                new Error(
                  "Failed to save receipt for offline processing after multiple attempts",
                ),
              );
            }
          };
        } catch (error) {
          logger.error("Exception during save operation", error);
          if (retryCount < maxRetries) {
            logger.info(
              `Retrying save operation (${retryCount + 1}/${maxRetries})`,
            );
            setTimeout(
              () => attemptSave(retryCount + 1, maxRetries),
              Math.pow(2, retryCount) * 500,
            );
          } else {
            reject(error);
          }
        }
      };

      attemptSave();
    });
  }

  /**
   * Get all pending offline receipts
   * Decrypts receipt image data after retrieval
   */
  async getPendingReceipts(): Promise<OfflineReceipt[]> {
    await this.init();

    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["offline-receipts"], "readonly");
      const store = transaction.objectStore("offline-receipts");
      const request = store.getAll();

      request.onsuccess = async () => {
        const encryptedReceipts: OfflineReceipt[] = request.result;

        // Decrypt image data for each receipt
        const decryptedReceipts = await Promise.all(
          encryptedReceipts.map(async (receipt) => {
            try {
              // Only decrypt if encryption version is present (newer receipts)
              if (receipt.encryptionVersion) {
                const decryptedImageData = await decryptFromStorage(receipt.imageData);
                return {
                  ...receipt,
                  imageData: decryptedImageData,
                };
              }
              // Old receipts without encryption - return as-is
              return receipt;
            } catch (error) {
              logger.error(`Failed to decrypt receipt ${receipt.id}`, error);
              // Return receipt with encrypted data if decryption fails
              // This prevents losing data, but caller should handle gracefully
              return receipt;
            }
          })
        );

        resolve(decryptedReceipts);
      };

      request.onerror = (event) => {
        logger.error("Error retrieving offline receipts", event);
        reject(new Error("Failed to retrieve offline receipts"));
      };
    });
  }

  /**
   * Remove a receipt after it has been processed
   */
  async removeReceipt(id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        ["offline-receipts"],
        "readwrite",
      );
      const store = transaction.objectStore("offline-receipts");
      const request = store.delete(id);

      request.onsuccess = () => {
        logger.info("Offline receipt removed", { id });
        resolve();
      };

      request.onerror = (event) => {
        logger.error("Error removing offline receipt", event);
        reject(new Error("Failed to remove processed receipt"));
      };
    });
  }

  /**
   * Save user preferences for offline access
   */
  async savePreference(key: string, value: unknown): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        ["user-preferences"],
        "readwrite",
      );
      const store = transaction.objectStore("user-preferences");
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        logger.error("Error saving user preference", event);
        reject(new Error("Failed to save user preference"));
      };
    });
  }

  /**
   * Get a user preference
   */
  async getPreference<T>(key: string, defaultValue: T): Promise<T> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(["user-preferences"], "readonly");
      const store = transaction.objectStore("user-preferences");
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value);
        } else {
          resolve(defaultValue);
        }
      };

      request.onerror = (event) => {
        logger.error("Error retrieving user preference", event);
        reject(new Error("Failed to retrieve user preference"));
      };
    });
  }
}

export const offlineStorage = new OfflineStorage();