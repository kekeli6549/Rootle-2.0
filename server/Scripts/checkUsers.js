// One-off diagnostic: list users in the local database
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rootle';
  await mongoose.connect(uri);
  const users = await mongoose.connection.db.collection('users')
    .find({}, { projection: { email: 1, role: 1, full_name: 1, department_id: 1 } })
    .toArray();
  console.log('USERS:', JSON.stringify(users, null, 2));
  const counts = {};
  for (const c of ['resources', 'departments', 'faculties', 'staffkeys', 'requests', 'ratings', 'downloads']) {
    counts[c] = await mongoose.connection.db.collection(c).countDocuments();
  }
  console.log('COUNTS:', JSON.stringify(counts));
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
