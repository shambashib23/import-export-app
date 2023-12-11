const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const passwordService = require('./password.reset.service');
/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (newPassword, passwordResetUrl) => {
  const user = await userService.getForgetPasswordOtpForUser(passwordResetUrl);

  if (!user) {
    // throw new ApiError(statusCode.UNAUTHORIZED, 'Invalid Email');
    throw new ApiError(statusCode.BAD_REQUEST, 'Invalid Email');
  }

  // Verify the password reset URL
  if (user.passwordResetTokenUrl !== passwordResetUrl) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid password reset URL');
  }

  await userService.updateUserById(user.id, { password: newPassword, passwordResetTokenUrl: '' });

  return true;
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */

const verifyOTP = async (userId, otp) => {
  const user = await userService.getUserById(userId);
  
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found with auth');
  }
  if (user.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP code');
  }
  user.otp = '';
  user.isEmailVerified = true;
  await user.save();
  return user;
};

const verifyForgotPasswordOTP = async (passwordResetOtp) => {
  const user = await userService.getForgetPasswordOtpForUser(passwordResetOtp);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found with auth');
  }

  if (user.passwordResetOtp !== passwordResetOtp) {
    throw ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP code');
  }

  // Generate the reset password token
  const resetPasswordToken = await tokenService.generateAuthTokens(user);

  const resetPasswordTokenString = resetPasswordToken.access.token;


  // Update the user's passwordResetTokenUrl field with just the token
  user.passwordResetTokenUrl = resetPasswordTokenString; // Assign the token string
  user.passwordResetOtp = '';
  await user.save();

  return {
    user,
    resetPasswordToken, // Include the token in the response
  };
};






module.exports = {
  loginUserWithEmailAndPassword,
  verifyForgotPasswordOTP,
  logout,
  refreshAuth,
  resetPassword,
  verifyOTP,
};
