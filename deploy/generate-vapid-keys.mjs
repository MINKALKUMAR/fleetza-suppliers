import crypto from 'node:crypto';

const ecdh = crypto.createECDH('prime256v1');
ecdh.generateKeys();

const pubBuf = ecdh.getPublicKey(); // 65 bytes uncompressed (0x04 + X + Y)
const rawPriv = ecdh.getPrivateKey();
const privBuf = rawPriv.length < 32
  ? Buffer.concat([Buffer.alloc(32 - rawPriv.length), rawPriv])
  : rawPriv;

const publicKey = pubBuf.toString('base64url');
const privateKey = privBuf.toString('base64url');

console.log('# Paste these lines into /etc/fleetza/supplier.env on your Hostinger VPS:');
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log('VAPID_SUBJECT=mailto:admin@fleetza.in');

