const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);