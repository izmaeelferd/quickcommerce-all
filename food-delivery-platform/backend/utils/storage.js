const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

let s3 = null;
function getS3() {
  if (!s3) {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3 = new S3Client({
      region: env.upload.s3.region,
      credentials: { accessKeyId: env.upload.s3.accessKeyId, secretAccessKey: env.upload.s3.secretAccessKey },
    });
  }
  return s3;
}

const uploadRoot = path.resolve(__dirname, '..', env.upload.dir);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

/** Persists a multer memory file and returns its public URL. */
async function saveFile(file, folder = 'misc') {
  const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, '') || 'misc';

  if (env.upload.driver === 's3') {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const Key = `${safeFolder}/${name}`;
    await getS3().send(
      new PutObjectCommand({ Bucket: env.upload.s3.bucket, Key, Body: file.buffer, ContentType: file.mimetype })
    );
    const base = env.upload.s3.publicUrl || `https://${env.upload.s3.bucket}.s3.${env.upload.s3.region}.amazonaws.com`;
    return `${base}/${Key}`;
  }

  const dir = path.join(uploadRoot, safeFolder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  return `${env.publicBaseUrl}/uploads/${safeFolder}/${name}`;
}

module.exports = { saveFile, uploadRoot };
