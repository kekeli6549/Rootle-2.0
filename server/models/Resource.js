const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    uploader_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    file_url: { type: String, required: true },
    file_hash: { type: String, required: true, unique: true },
    file_type: { type: String },
    status: { type: String, enum: ['pending', 'approved'], default: 'approved' },
    download_count: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);