
import fs from 'node:fs';
import bs58 from 'bs58';
import os from 'node:os'

// Replace with the path to your keypair file
const keypairPath = '~/.config/solana/id.json'; 
const resolvedPath = keypairPath.replace('~', os.homedir());

// Read and parse the keypair file
const keypairFile = fs.readFileSync(resolvedPath, 'utf8');
const secretKeyBytes = JSON.parse(keypairFile);

// The secret key is the full 64-byte array in this format
const secretKey = Uint8Array.from(secretKeyBytes);

// Encode the secret key in Base58
const privateKeyBase58 = bs58.encode(secretKey);

console.log('Your Base58 private key is:', privateKeyBase58);
