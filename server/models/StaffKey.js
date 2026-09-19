const mongoose = require('mongoose');

const StaffKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  department_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    required: function() { return this.role !== 'superadmin'; } 
  },
  role: { 
    type: String, 
    enum: ['lecturer', 'admin', 'superadmin'], 
    default: 'lecturer' 
  },
  is_used: { type: Boolean, default: false },
  first_attempted_at: { type: Date, default: null }, // ⏱ Tracks when the 120s countdown starts
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expires_at: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('StaffKey', StaffKeySchema);