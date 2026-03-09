const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = require('./config');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/* ── Upload a file to R2 ── */
async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return getR2Url(key);
}

/* ── Delete a file from R2 ── */
async function deleteFromR2(key) {
  await s3.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
}

/* ── List objects under a prefix ── */
async function listR2Objects(prefix) {
  const items = [];
  let continuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    }));
    if (res.Contents) items.push(...res.Contents);
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return items;
}

/* ── Get a buffer from R2 ── */
async function getR2Buffer(key) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/* ── Check if an object exists ── */
async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/* ── Get a readable stream from R2 (for proxy) ── */
async function getR2Stream(key) {
  const res = await s3.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
  return {
    stream: res.Body,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

/* ── Get public URL for a key ── */
function getR2Url(key) {
  return `${R2_PUBLIC_URL}/${key}`;
}

module.exports = { uploadToR2, deleteFromR2, listR2Objects, getR2Buffer, getR2Stream, existsInR2, getR2Url, s3 };
