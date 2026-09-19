const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'lecturer', 'admin', 'superadmin'], // ✅ Added superadmin
    default: 'student' 
  },
  department_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    required: function() { return this.role !== 'superadmin'; } // ✅ Optional for superadmin
  },
  student_id: { type: String, default: null },
  staff_id: { type: String, default: null },
  totalUploads: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badgeTitle: { type: String, default: 'Novice Scholar' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);