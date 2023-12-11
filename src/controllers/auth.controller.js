const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, generateOtp } = require('../services');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { responseMessage } = require('../utils/common');
const User = require('../models/user.model')



const registerUser = catchAsync(async (req, res) => {
  const userBody = req.body;
  // const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
  // const dotNumber = `#${randomNumber}`;
  // userBody.dotNumber = dotNumber;
  const { email } = userBody;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Handle the case where the email is already in use
    throw new ApiError(httpStatus.NOT_FOUND, 'Email is already in use');
  }
  const user = await userService.createUser(userBody);
  new ApiResponse(res, httpStatus.CREATED, responseMessage.REGISTER, user);
})




const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  new ApiResponse(res, httpStatus.OK, responseMessage.LOGIN, user, tokens);
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  new ApiResponse(res, httpStatus.OK, responseMessage.LOGOUT);
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {

  const OTP = Math.floor(1000 + Math.random() * 9000);
  const templateId = 'd-9528759258d14ab9b2628f5755f06485';
  await tokenService.SavePasswordResetOtp(req.body.email, OTP);
  const dynamicData = {
    OTP: OTP
  };
  await emailService.sendVerificationEmail(req.body.email, templateId, dynamicData);
  new ApiResponse(res, httpStatus.OK, responseMessage.FORGOT_PASSWORD);
});

const resetPassword = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const { password } = req.body;

    const updatedUser = await userService.updateUserById(req.user.id, password);
    const response = {
      code: 200,
      message: 'You Have Successfully reset your password!',
      isSuccess: true,
      data: updatedUser,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};


const sendVerificationEmail = catchAsync(async (req, res) => {
  try {
    const { email } = req.body;
    const templateId = 'd-56a7cb356c214e36bbdda266c750bb3c';
    const OTP = Math.floor(1000 + Math.random() * 9000);
    const user = await User.findOne({ email: email });
    user.otp = OTP;
    await user.save();

    // Send the email
    const dynamicData = {
      OTP: OTP
    };

    await emailService.sendVerificationEmail(email, templateId, dynamicData);
    // Respond with a success message
    new ApiResponse(res, httpStatus.OK, 'Verification Email sent successfully!');
  } catch (error) {
    console.error('Email sending failed:', error);

    // Respond with an error message
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      code: httpStatus.INTERNAL_SERVER_ERROR,
      message: 'Email sending failed',
      isSuccess: false,
      data: {},
    });
  }
});


const verifyOTP = catchAsync(async (req, res) => {
  const userId = req.user.id
  const User = await userService.getUserById(userId)
  if (!User) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { otp } = req.body;
  const user = await authService.verifyOTP(userId, otp);
  new ApiResponse(res, httpStatus.OK, responseMessage.VERIFICATION_STATUS);
  // res.status(httpStatus.OK).send({ message: 'OTP verified successfully', id: user.id });
});



const verifyResetPasswordOtp = catchAsync(async (req, res) => {
  const { passwordResetOtp } = req.body;

  try {
    const result = await authService.verifyForgotPasswordOTP(passwordResetOtp);

    res.status(httpStatus.OK).json({
      code: 200,
      message: 'Reset password otp verified successfully',
      isSuccess: true,
      data: {
        "role": result.user.role,
        "isEmailVerified": result.user.isEmailVerified,
        "passwordResetOtp": result.user.passwordResetOtp,
        "passwordResetTokenUrl": result.user.passwordResetTokenUrl,
        "fullName": result.user.fullName,
        "email": result.user.email,
        "location": result.user.location,
        "id": result.user.id,
      },
      "accessToken": result.resetPasswordToken.access.token,
      "refreshToken": result.resetPasswordToken.refresh.token
    });
  } catch (error) {
    // Handle any errors that may occur during verification
    res.status(error.statusCode || httpStatus.INTERNAL_SERVER_ERROR).json({
      code: error.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal Server Error',
      isSuccess: false,
      data: {},
    });
  }
});


module.exports = {

  registerUser,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyOTP,
  verifyResetPasswordOtp
};
