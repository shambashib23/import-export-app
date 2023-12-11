const mongoose = require('mongoose');
const validator = require('validator');

const { toJSON, paginate } = require('./plugins');
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    feedback: {
      type: String,
      required: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },

  {
    timestamps: true,
    versionKey: false
  }
);

reviewSchema.plugin(toJSON);
reviewSchema.plugin(paginate);

/**
 * @typedef Review
 */
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;