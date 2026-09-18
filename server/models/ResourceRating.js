const mongoose = require('mongoose');

const resourceRatingSchema = new mongoose.Schema({
    resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating_value: { type: Number, required: true, min: 1, max: 5 }
});

resourceRatingSchema.index({ resource_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('ResourceRating', resourceRatingSchema);