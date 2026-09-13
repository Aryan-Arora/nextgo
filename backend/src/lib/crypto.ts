import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { config } from '../config.js';

// AES-256-GCM at rest for any field that must never be readable from a
// database dump alone (bank account numbers, provider credentials). The key
// reference lets us rotate keys later without a data migration: decrypt
// dispatches on the reference stored alongside the ciphertext.
const LOCAL_KEY_REFERENCE = 'local-dev-key-v1';
const key = Buffer.from(config.LOCAL_ENCRYPTION_KEY, 'base64');
if (key.length !== 32) {
  throw new Error('LOCAL_ENCRYPTION_KEY must decode to exactly 32 bytes');
}

export function encryptSecret(plaintext: string): { ciphertext: Buffer; keyReference: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { ciphertext: Buffer.concat([iv, authTag, encrypted]), keyReference: LOCAL_KEY_REFERENCE };
}

export function decryptSecret(ciphertext: Buffer, keyReference: string): string {
  if (keyReference !== LOCAL_KEY_REFERENCE) {
    throw new Error(`Unknown encryption key reference: ${keyReference}`);
  }
  const iv = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(12, 28);
  const encrypted = ciphertext.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Never return the raw account number to any client, including the owning
// seller after submission — only enough to confirm which account is on file.
export function maskAccountNumber(accountNumber: string): string {
  return accountNumber.length <= 4 ? '••••' : `••••${accountNumber.slice(-4)}`;
}
