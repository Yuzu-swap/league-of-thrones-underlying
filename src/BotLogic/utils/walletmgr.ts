import * as crypto from 'crypto';
function generateEncryptKey(encryptKey) {
  encryptKey =  encryptKey + "dsf#!@#Dfadsfgj";
  encryptKey = encryptKey.replace(/#/g, "!");
  encryptKey = encryptKey.replace(/g/g, "h");
  let salt = Buffer.alloc(16);
  
  let iterations = 4096;
  let keyLength = 32;
  let derivedKey = crypto.pbkdf2Sync(encryptKey, salt, iterations, keyLength, 'sha256');

  return derivedKey.toString('hex');
}
export function decrypt(ciphertext) {
  const key = generateEncryptKey(process.env.YUZUSWAP_SECRET_KEY)

  let keyBytes = Buffer.from(key, 'hex');
  let ciphertextBytes = Buffer.from(ciphertext, 'hex');

  
  if(ciphertextBytes.length < 16) {
      throw new Error('Ciphertext too short');
  }

  let iv = ciphertextBytes.slice(0, 16);
  ciphertextBytes = ciphertextBytes.slice(16);
  
  let decipher = crypto.createDecipheriv('aes-256-cfb', keyBytes, iv);
  let decrypted = decipher.update(ciphertextBytes);

  let final = decipher.final();
  return Buffer.concat([decrypted, final]).toString();
}
