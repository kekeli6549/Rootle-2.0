const mongoose = require('mongoose');

/**
 * Tracks that a specific user has downloaded a specific resource at least once.
 * Used to enforce the rule: "you can only rate a document after downloading it."
 */
const userResourceDownloadSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    downloaded_at: { type: Date, default: Date.now }
}, { timestamps: true });

// One record per user per resource (we only care "downloaded at least once").
userResourceDownloadSchema.index({ user_id: 1, resource_id: 1 }, { unique: true });

module.exports = mongoose.model('UserResourceDownload', userResourceDownloadSchema);
