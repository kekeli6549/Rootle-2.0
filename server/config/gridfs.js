// server/config/gridfs.js
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

const BUCKET_NAME = 'rootle_files';
let bucket = null;

const getBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error('Database is not connected yet. Call connectDB() first.');
  }
  if (!bucket || bucket.db !== mongoose.connection.db) {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
  }
  return bucket;
};

// Resource.file_url values for GridFS files look like "/api/resources/file/<id>".
const getFileIdFromUrl = (fileUrl) => {
  if (!fileUrl) return null;
  const match = String(fileUrl).match(/\/api\/resources\/file\/([a-fA-F0-9]{24})/);
  if (!match || !ObjectId.isValid(match[1])) return null;
  return new ObjectId(match[1]);
};

const deleteFileByUrl = async (fileUrl) => {
  const id = getFileIdFromUrl(fileUrl);
  if (!id) return false;
  try {
    await getBucket().delete(id);
    return true;
  } catch (err) {
    // Already gone is fine; real errors should be logged but not break the request.
    if (err.code !== 404) console.error('GridFS delete error:', err.message);
    return false;
  }
};

module.exports = { getBucket, getFileIdFromUrl, deleteFileByUrl, ObjectId };
