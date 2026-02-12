/**
 * Secure Cryptography Module
 *
 * Provides real encryption/decryption using Web Crypto API with AES-GCM-256.
 * Replaces the insecure Base64 "encryption" from security.ts.
 *
 * Features:
 * - PBKDF2 key derivation with user-specific salt
 * - AES-GCM-256 authenticated encryption
 * - Key rotation support with versioning
 * - Secure session storage for derived keys
 */

import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

// Encryption version for future key rotation
const ENCRYPTION_VERSION = 1;

// Crypto parameters
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 256; // bits

/**
 * Encrypted data structure with metadata
 */
export interface EncryptedData {
  version: number;
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
  authTag?: string; // Included in ciphertext for GCM
}

/**
 * Generate a cryptographically secure random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a cryptographically secure random IV
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert Uint8Array to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an encryption key from a passphrase using PBKDF2
 *
 * @param passphrase - User passphrase or session identifier
 * @param salt - Salt for key derivation
 * @returns Derived CryptoKey for AES-GCM
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Use PBKDF2 with SHA-256
  const derivedKeyBytes = pbkdf2(sha256, passphrase, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LENGTH / 8, // Convert bits to bytes
  });

  // Import the derived key bytes as a CryptoKey
  return await crypto.subtle.importKey(
    'raw',
    derivedKeyBytes,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or generate a session passphrase
 * Uses a session-specific identifier to derive encryption keys.
 * In production, this should be derived from user authentication.
 */
function getSessionPassphrase(): string {
  const key = 'secure_session_passphrase';

  // Try to get existing passphrase from sessionStorage
  let passphrase = sessionStorage.getItem(key);

  if (!passphrase) {
    // Generate a new secure random passphrase for this session
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    passphrase = arrayBufferToBase64(randomBytes);
    sessionStorage.setItem(key, passphrase);
  }

  return passphrase;
}

/**
 * Encrypt data using AES-GCM with PBKDF2 key derivation
 *
 * @param data - Plain text data to encrypt
 * @returns Encrypted data with metadata
 *
 * @example
 * ```typescript
 * const encrypted = await encryptData('sensitive information');
 * // Store encrypted.ciphertext, encrypted.salt, encrypted.iv
 * ```
 */
export async function encryptData(data: string): Promise<EncryptedData> {
  try {
    // Generate random salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Get session passphrase and derive key
    const passphrase = getSessionPassphrase();
    const key = await deriveKey(passphrase, salt);

    // Convert data to bytes
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);

    // Encrypt using AES-GCM (includes authentication tag)
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBytes
    );

    // Return encrypted data with metadata
    return {
      version: ENCRYPTION_VERSION,
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data that was encrypted with encryptData
 *
 * @param encryptedData - Encrypted data object with metadata
 * @returns Decrypted plain text
 *
 * @example
 * ```typescript
 * const decrypted = await decryptData(encryptedData);
 * console.log(decrypted); // 'sensitive information'
 * ```
 */
export async function decryptData(encryptedData: EncryptedData): Promise<string> {
  try {
    // Check version compatibility
    if (encryptedData.version > ENCRYPTION_VERSION) {
      throw new Error('Unsupported encryption version');
    }

    // Parse metadata
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);

    // Get session passphrase and derive key
    const passphrase = getSessionPassphrase();
    const key = await deriveKey(passphrase, salt);

    // Decrypt using AES-GCM (verifies authentication tag)
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    // Convert bytes back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
  }
}

/**
 * Encrypt data for storage (convenience wrapper)
 * Returns a JSON string that can be stored directly
 */
export async function encryptForStorage(data: string): Promise<string> {
  const encrypted = await encryptData(data);
  return JSON.stringify(encrypted);
}

/**
 * Decrypt data from storage (convenience wrapper)
 * Expects a JSON string from encryptForStorage
 */
export async function decryptFromStorage(encryptedJson: string): Promise<string> {
  const encrypted: EncryptedData = JSON.parse(encryptedJson);
  return await decryptData(encrypted);
}

/**
 * Clear the session passphrase (call on logout)
 */
export function clearEncryptionSession(): void {
  sessionStorage.removeItem('secure_session_passphrase');
}

/**
 * Check if encryption is available in this environment
 */
export function isEncryptionAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.encrypt === 'function' &&
    typeof crypto.subtle.decrypt === 'function'
  );
}
