const mongoose = require('mongoose');

const deletionRequestSchema = new mongoose.Schema({
    resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeletionRequest', deletionRequestSchema);