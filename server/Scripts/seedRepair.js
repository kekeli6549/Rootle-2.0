// One-off repair: complete the seeding that index.js aborted (Resource is not
// defined at line 103). Replicates seedDatabase() exactly — same indexes,
// same accounts, same hashes — idempotent.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rootle';
  await mongoose.connect(uri);

  const Faculty = require('../models/Faculty');
  const Department = require('../models/Department');
  const User = require('../models/User');
  const Resource = require('../models/Resource');
  const ResourceRating = require('../models/ResourceRating');
  const ResourceRequest = require('../models/ResourceRequest');

  // Faculties & departments (idempotent, same structure as seedDatabase)
  const structure = [
    { faculty: 'Science', departments: ['Computer Science', 'Physics'] },
    { faculty: 'Arts', departments: ['English Literature', 'History'] },
    { faculty: 'Commercial', departments: ['Accounting', 'Economics'] },
  ];
  let defaultDeptId = null;
  for (const item of structure) {
    let facultyDoc = await Faculty.findOne({ name: item.faculty });
    if (!facultyDoc) facultyDoc = await Faculty.create({ name: item.faculty });
    for (const deptName of item.departments) {
      let dept = await Department.findOne({ name: deptName, faculty_id: facultyDoc._id });
      if (!dept) dept = await Department.create({ name: deptName, faculty_id: facultyDoc._id });
      if (!defaultDeptId) defaultDeptId = dept._id;
    }
  }
  console.log('Faculties & Departments verified.');

  // Indexes — best effort; mongoose auto-creates schema indexes on connect,
  // and a pre-existing index with different options must not abort the seed.
  const ensure = (fn) => fn().catch(e => console.log('index note:', e.message));
  await ensure(() => User.collection.createIndex({ email: 1 }, { unique: true }));
  await ensure(() => User.collection.createIndex({ role: 1 }));
  await ensure(() => User.collection.createIndex({ department_id: 1 }));
  await ensure(() => Resource.collection.createIndex({ department_id: 1 }));
  await ensure(() => Resource.collection.createIndex({ uploader_id: 1 }));
  await ensure(() => Resource.collection.createIndex({ status: 1 }));
  await ensure(() => Resource.collection.createIndex({ file_hash: 1 }, { unique: true }));
  await ensure(() => Resource.collection.createIndex({ created_at: -1 }));
  await ensure(() => ResourceRating.collection.createIndex({ resource_id: 1, user_id: 1 }));
  await ensure(() => ResourceRequest.collection.createIndex({ department_id: 1, is_fulfilled: 1 }));
  await ensure(() => ResourceRequest.collection.createIndex({ requester_id: 1 }));
  console.log('Database indexes ensured.');

  // SuperAdmin
  if (!await User.exists({ email: 'sysadmin@rootle.com' })) {
    const salt = await bcrypt.genSalt(10);
    await User.create({
      full_name: 'Rootle System Core',
      email: 'sysadmin@rootle.com',
      password_hash: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, salt),
      role: 'superadmin',
      staff_id: 'ROOTLE-SA-01',
    });
    console.log('SuperAdmin account seeded.');
  }

  // Department Admin
  if (!await User.exists({ email: 'deptadmin@rootle.com' })) {
    const salt = await bcrypt.genSalt(10);
    await User.create({
      full_name: 'CS Dept Admin',
      email: 'deptadmin@rootle.com',
      password_hash: await bcrypt.hash(process.env.DEPT_ADMIN_PASSWORD, salt),
      role: 'admin',
      department_id: defaultDeptId,
      staff_id: 'ROOTLE-ADM-01',
    });
    console.log('Department Admin account seeded.');
  }

  const users = await User.find({}, { email: 1, role: 1 }).lean();
  console.log('USERS:', JSON.stringify(users));
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
