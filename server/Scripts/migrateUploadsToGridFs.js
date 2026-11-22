// One-off migration: moves files from server/uploads into MongoDB GridFS and
// rewrites Resource.file_url. Run LOCALLY (where the uploads folder exists):
//   node Scripts/migrateUploadsToGridFs.js
//
// It is idempotent: resources already pointing at /api/resources/file/... are skipped.

const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Some local networks cannot resolve MongoDB Atlas SRV records with their
// default DNS. Public resolvers fix that without changing the connection string.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = require('../config/db');
const { getBucket } = require('../config/gridfs');
const Resource = require('../models/Resource');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const uploadOne = (bucket, filePath, originalName, contentType) => new Promise((resolve, reject) => {
  const stream = bucket.openUploadStream(originalName, {
    contentType,
    metadata: { migratedFrom: path.basename(filePath) }
  });
  stream.on('error', reject);
  stream.on('finish', () => resolve(stream.id));
  fs.createReadStream(filePath).pipe(stream);
});

const migrate = async () => {
  await connectDB();

  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory found. Nothing to migrate.');
    process.exit(0);
  }

  const files = fs.readdirSync(uploadsDir).filter((name) => !name.startsWith('.'));
  console.log(`Found ${files.length} file(s) to migrate.`);

  const bucket = getBucket();
  let migrated = 0;
  let skipped = 0;

  for (const filename of files) {
    const legacyUrl = `uploads/${filename}`;
    const resource = await Resource.findOne({ file_url: legacyUrl });

    if (!resource) {
      console.log(`⚠️  No resource references ${legacyUrl}; skipping.`);
      skipped += 1;
      continue;
    }

    const filePath = path.join(uploadsDir, filename);
    const gridFsId = await uploadOne(bucket, filePath, filename, resource.file_type || 'application/octet-stream');

    resource.file_url = `/api/resources/file/${gridFsId}`;
    await resource.save();

    migrated += 1;
    console.log(`✅ ${filename} -> ${gridFsId}`);
  }

  console.log(`\nDone. Migrated: ${migrated}, skipped: ${skipped}.`);
  console.log('Original files were left in server/uploads as a backup. Delete them once verified.');
  process.exit(0);
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
