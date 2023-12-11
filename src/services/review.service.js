const httpStatus = require('http-status');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { Review } = require('../models');


/**
 * Give feedback using user id
 * @param {ObjectId} user id
 * @body {string} feedback
 * @returns {Promise<User>}
 */

const createReview = async (userId, feedback) => {
  // Create a new review document with the provided data
  const review = new Review({ userId, feedback });
  return review.save();
};



module.exports = {
  createReview,
};
