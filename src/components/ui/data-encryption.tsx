/**
 * Client-side encryption utilities for sensitive data
 *
 * This component provides utilities for encrypting/decrypting sensitive data
 * on the client side before sending to or after receiving from the server.
 *
 * Note: Client-side encryption is not a replacement for proper TLS/HTTPS,
 * but adds an extra layer of protection for sensitive data.
 */

import { useEffect, useState } from "react";

// Generate a random encryption key or use a stored one
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // In a real app, you might want to store this key securely
  // For demo purposes, we'll generate a new one each time
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
};

// Convert string to ArrayBuffer
const str2ab = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Convert ArrayBuffer to string
const ab2str = (buf: ArrayBuffer): string => {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
};

// Convert ArrayBuffer to base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// Convert base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Encrypt data
export const encryptData = async (data: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      str2ab(data),
    );

    // Combine IV and encrypted data and convert to base64
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error("Encryption error:", error);
    return data; // Fallback to unencrypted data
  }
};

// Decrypt data
export const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const key = await getEncryptionKey();
    const combined = base64ToArrayBuffer(encryptedData);

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      key,
      data,
    );

    return ab2str(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedData; // Return the encrypted data if decryption fails
  }
};

// React hook for encrypting/decrypting data
export const useEncryption = () => {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if the browser supports the Web Crypto API
    setIsSupported(
      typeof window !== "undefined" &&
        window.crypto &&
        window.crypto.subtle !== undefined,
    );
  }, []);

  return {
    encryptData,
    decryptData,
    isSupported,
  };
};
