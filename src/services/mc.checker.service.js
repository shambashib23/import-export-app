const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const userService = require('./user.service');
const { User } = require('../models');
// const { paginate } = require('../models/plugins');
const { Admin } = require('../models');
const { McChecker } = require('../models');
const { Load } = require('../models');
const Payment = require('../models/payment.request.model');
const ApiResponse = require('../utils/ApiResponse');
const { responseMessage } = require('../utils/common');
const Review = require('../models/review.model');
const NodeCache = require("node-cache");
const userCache = new NodeCache();





/**
 * Get mcNumbers by Admin Id
 * @param {Object} adminId
 * @returns {Promise<McChecker>}
 */

const fetchMcNumbersByAdmin = async (adminId) => {
  const numbers = await McChecker.find().populate('carrierData');
  return numbers;
};


/**
 * Check if the user's MC number matches the admin's MC number.
 * If they match, change the safetyScore to 'Approved' and riskScore to 'Low'.
 * @param {string} userId - User's ID
 * @param {string} adminId - Admin's ID
 * @param {string} userMcNumber - User's MC number to be checked
 * @returns {Promise<void>}
 */
const checkAndSetSafetyAndRisk = async (userId, adminId) => {
  try {
    // Find the user by userId and populate the user's admin
    const user = await User.findById(userId).populate('admin');

    if (!user) {
      throw new Error('User not found');
    }

    // Find the MC numbers created by the admin
    const mcCheckers = await McChecker.find({ createdBy: adminId });

    if (mcCheckers.length === 0) {
      throw new Error('No MC Checkers found for the admin');
    }

    const userMCNumber = user.mcNumber;

    if (mcCheckers.some((mcChecker) => mcChecker.mcNumber === userMCNumber)) {
      // MC number found, set safetyScore to 'Approved', riskScore to 'Low', and isMcNumberVerified to true
      user.safetyScore = 'Approved';
      user.riskScore = 'Low';
      user.isMcNumberVerified = true;
    }

    // Save the updated user
    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
}


const updateMcChecker = async (userId, updateBody) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  }
  if (updateBody.safetyScore && updateBody.riskScore) {
    user.safetyScore = updateBody.safetyScore;
    user.riskScore = updateBody.riskScore;
    user.dotNumber = updateBody.dotNumber;

    // Check if safetyScore is updated and riskScore is not 'Rejected' or 'Pending'
    if (updateBody.safetyScore !== 'Rejected' && updateBody.safetyScore !== 'Pending') {
      // Generate a dotNumber of 7 digits
      user.dotNumber = updateBody.dotNumber;
    }
  }

  // Check if an admin wants to revoke isMcNumberVerified
  if (updateBody.safetyScore === 'Rejected' || updateBody.safetyScore === 'Pending') {
    user.isMcNumberVerified = false;
    user.dotNumber = updateBody.dotNumber;
  } else {
    // If not rejected, update isMcNumberVerified based on the original status
    if (user.isMcNumberVerified !== true) {
      user.isMcNumberVerified = true;
      user.dotNumber = updateBody.dotNumber;
    }
  }
  await user.save();
  return user;
};


const searchMcNumberService = async (mcNumber) => {
  try {
    const mcData = await User.findOne({ mcNumber });
    if (!mcData) {
      throw new Error(httpStatus.NOT_FOUND, 'McChecker response not found.');
    }
    return mcData;
  } catch (error) {
    throw error;
  }
}




module.exports = {
  fetchMcNumbersByAdmin,
  checkAndSetSafetyAndRisk,
  updateMcChecker,
  searchMcNumberService
}

