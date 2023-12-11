const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { reviewService } = require('../services');
const { responseMessage } = require('../utils/common');
const ApiResponse = require('../utils/ApiResponse');
/**
 * Post feedback by user ID
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */

const postReviewById = async (req, res, next) => {
  try {
    const { userId } = req.params; // Get the user ID from route params
    const { feedback } = req.body; // Get feedback from request body

    // Create a new review document and associate it with the user ID
    const review = await reviewService.createReview(userId, feedback);

    new ApiResponse(res, httpStatus.OK, responseMessage.REVIEW_SUCCESS, review)
    // res.status(httpStatus.CREATED).json({ userId: review.userId, feedback: review.feedback });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  postReviewById,
};
