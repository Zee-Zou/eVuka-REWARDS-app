/**
 * Tests for crypto-secure module
 * Verifies AES-GCM encryption/decryption functionality
 */

import {
  encryptData,
  decryptData,
  encryptForStorage,
  decryptFromStorage,
  clearEncryptionSession,
  isEncryptionAvailable,
} from './crypto-secure';

describe('crypto-secure', () => {
  beforeEach(() => {
    // Clear encryption session before each test
    clearEncryptionSession();
  });

  describe('isEncryptionAvailable', () => {
    it('should return true in test environment', () => {
      expect(isEncryptionAvailable()).toBe(true);
    });
  });

  describe('encryptData and decryptData', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const plaintext = 'sensitive information';

      const encrypted = await encryptData(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted.version).toBe(1);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      // Ciphertext should not contain plaintext
      expect(encrypted.ciphertext).not.toContain(plaintext);

      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext', async () => {
      const plaintext = 'test data';

      const encrypted1 = await encryptData(plaintext);
      const encrypted2 = await encryptData(plaintext);

      // Different salt and IV should produce different ciphertexts
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Both should decrypt to same plaintext
      const decrypted1 = await decryptData(encrypted1);
      const decrypted2 = await decryptData(encrypted2);

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should handle empty strings', async () => {
      const plaintext = '';

      const encrypted = await encryptData(plaintext);
      const decrypted = await decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const plaintext = 'Hello 世界 🌍 Émojis!';

      const encrypted = await encryptData(plaintext);
      const decrypted = await decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long strings', async () => {
      const plaintext = 'a'.repeat(10000);

      const encrypted = await encryptData(plaintext);
      const decrypted = await decryptData(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt tampered ciphertext', async () => {
      const plaintext = 'sensitive data';
      const encrypted = await encryptData(plaintext);

      // Tamper with ciphertext
      const tamperedCiphertext = encrypted.ciphertext.slice(0, -1) + 'X';
      const tampered = {
        ...encrypted,
        ciphertext: tamperedCiphertext,
      };

      await expect(decryptData(tampered)).rejects.toThrow();
    });

    it('should fail with invalid encryption version', async () => {
      const plaintext = 'test';
      const encrypted = await encryptData(plaintext);

      // Future version
      const futureVersion = {
        ...encrypted,
        version: 999,
      };

      await expect(decryptData(futureVersion)).rejects.toThrow(
        'Unsupported encryption version'
      );
    });
  });

  describe('encryptForStorage and decryptFromStorage', () => {
    it('should encrypt to JSON string and decrypt back', async () => {
      const plaintext = 'storage test data';

      const encryptedJson = await encryptForStorage(plaintext);

      // Should be valid JSON
      expect(() => JSON.parse(encryptedJson)).not.toThrow();

      const parsed = JSON.parse(encryptedJson);
      expect(parsed.version).toBe(1);
      expect(parsed.ciphertext).toBeDefined();
      expect(parsed.salt).toBeDefined();
      expect(parsed.iv).toBeDefined();

      const decrypted = await decryptFromStorage(encryptedJson);
      expect(decrypted).toBe(plaintext);
    });

    it('should work with receipt image data', async () => {
      // Simulated base64 image data
      const imageData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const encrypted = await encryptForStorage(imageData);
      const decrypted = await decryptFromStorage(encrypted);

      expect(decrypted).toBe(imageData);
    });
  });

  describe('session management', () => {
    it('should use consistent key within same session', async () => {
      const plaintext = 'test';

      const encrypted1 = await encryptData(plaintext);
      const encrypted2 = await encryptData(plaintext);

      // Both should decrypt successfully (same session passphrase)
      const decrypted1 = await decryptData(encrypted1);
      const decrypted2 = await decryptData(encrypted2);

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    it('should fail to decrypt after session clear', async () => {
      const plaintext = 'session test';
      const encrypted = await encryptData(plaintext);

      // Decrypt should work before clearing
      const decrypted1 = await decryptData(encrypted);
      expect(decrypted1).toBe(plaintext);

      // Clear session
      clearEncryptionSession();

      // Decrypt should fail with new session passphrase
      // (This is expected behavior - encryption is session-based)
      await expect(decryptData(encrypted)).rejects.toThrow();
    });
  });

  describe('security properties', () => {
    it('should not use Base64 encoding as encryption', async () => {
      const plaintext = 'test123';

      const encrypted = await encryptData(plaintext);

      // The old insecure implementation would just use btoa()
      const base64 = btoa(plaintext);

      // Real encryption should be different from Base64
      expect(encrypted.ciphertext).not.toBe(base64);
    });

    it('should include authentication tag (GCM mode)', async () => {
      const plaintext = 'authenticated';

      const encrypted = await encryptData(plaintext);

      // Tampering should be detected
      // Try to change salt (which affects key derivation)
      const tampered = {
        ...encrypted,
        salt: 'invalidbase64',
      };

      await expect(decryptData(tampered)).rejects.toThrow();
    });

    it('should use different salts for each encryption', async () => {
      const plaintext = 'test';

      const encrypted1 = await encryptData(plaintext);
      const encrypted2 = await encryptData(plaintext);

      // Salts should be unique (prevents rainbow table attacks)
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should use different IVs for each encryption', async () => {
      const plaintext = 'test';

      const encrypted1 = await encryptData(plaintext);
      const encrypted2 = await encryptData(plaintext);

      // IVs should be unique (prevents pattern detection)
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });
});
