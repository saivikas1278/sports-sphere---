import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads'); // since we run this in server root

console.log('Uploads dir:', uploadsDir);
console.log('Exists?', fs.existsSync(uploadsDir));
if (fs.existsSync(uploadsDir)) {
  console.log('Contents:', fs.readdirSync(uploadsDir));
  if (fs.existsSync(path.join(uploadsDir, 'avatars'))) {
    console.log('Avatars:', fs.readdirSync(path.join(uploadsDir, 'avatars')));
  }
}
