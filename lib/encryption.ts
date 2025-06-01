import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Simple encryption utility to secure session data
 * @param data String to encrypt
 * @param secret Secret key for encryption
 * @returns Encrypted string
 */
export function encrypt(data: string, secret: string): string {
  // Use 16 bytes for IV (Initialization Vector)
  const iv = randomBytes(16);
  // Create a buffer from secret (should be 32 bytes for aes-256-cbc)
  const key = Buffer.from(secret.padEnd(32).slice(0, 32));
  
  // Create cipher
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  
  // Encrypt data
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data (IV is needed for decryption)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data that was encrypted with the encrypt function
 * @param encryptedData Encrypted string
 * @param secret Secret key used for encryption
 * @returns Decrypted string
 */
export function decrypt(encryptedData: string, secret: string): string {
  // Split IV and encrypted data
  const [ivHex, encrypted] = encryptedData.split(':');
  
  // Convert hex strings back to buffers
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(secret.padEnd(32).slice(0, 32));
  
  // Create decipher
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  
  // Decrypt data
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
