const mongoose = require('mongoose');

const resourceRequestSchema = new mongoose.Schema({
    requester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    title: { type: String, required: true },
    description: { type: String },
    is_fulfilled: { type: Boolean, default: false },
    fulfilled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fulfilled_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResourceRequest', resourceRequestSchema);