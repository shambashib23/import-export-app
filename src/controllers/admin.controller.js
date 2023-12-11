const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { adminService, tokenService, mcCheckerService, userService, loadService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { responseMessage } = require('../utils/common');
const pick = require('../utils/pick');
const { Admin } = require('../models/admin.model');
// const { Payment } = require('../models/payment.request.model');


const registerAdmin = catchAsync(async (req, res) => {
  // Check if an admin with the same email already exists
  const existingAdmin = await adminService.getAdminByEmail(req.body.email);

  if (existingAdmin) {
    throw new Error('Admin with this email already exists');
  }

  const admin = await adminService.createAdmin(req.body);

  new ApiResponse(res, httpStatus.CREATED, responseMessage.REGISTER_ADMIN, admin);
})

const getAdminInfo = catchAsync(async (req, res) => {
  const adminInfo = await adminService.getAdminById(req.user._id);

  if (!adminInfo) {
    throw new Error('Admin with this id is not present');
  };
  new ApiResponse(res, httpStatus.OK, responseMessage.ADMIN_DATA, adminInfo);
});


const editProfileDataForAdmin = catchAsync(async (req, res) => {
  const { adminId } = req.params;
  // const user = req.user;
  // console.log('admin', user);
  const { email, password, fullName } = req.body;
  const updatedData = {
    email,
    password,
    fullName
  };
  const updatedAdmin = await adminService.updateProfileAdmin(adminId, updatedData);
  new ApiResponse(res, httpStatus.OK, responseMessage.UPDATE_ADMIN_SUCCESS, updatedAdmin);
})

const login = catchAsync(async (req, res) => {
  const { fullName, email, password } = req.body;
  const admin = await adminService.loginAdminWithEmailAndPassword(fullName, email, password);
  const tokens = await tokenService.generateAuthTokens(admin);
  new ApiResponse(res, httpStatus.OK, responseMessage.ADMIN_LOGIN, admin, tokens);
});



const filterUsersByRoleInAdmin = catchAsync(async (req, res) => {
  try {
    const { role, limit, page } = req.query; // Get the role from the query parameters
    const users = await adminService.filterUsersByRole(role, limit, page);
    const admin = req.user;
    if (admin.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to filter Users by role');
    }
    const currentPage = parseInt(req.query.page, 10) || 1;

    const response = {
      code: httpStatus.OK,
      message: responseMessage.FILTER_SUCCESS,
      isSuccess: true,
      data: {
        ...users,
        currentPage, // Include the current page number
      },
    };
    res.json(response);
  } catch (error) {
    throw new Error(error);
  }
});


const filterUsersByMailInAdmin = catchAsync(async (req, res) => {
  try {
    const { isEmailVerified, limit, page } = req.query; // Get the role from the query parameters
    const users = await adminService.filterUsersByMailVerification(isEmailVerified, limit, page);
    const admin = req.user;
    if (admin.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to filter Users by role');
    }
    // Calculate the current page based on the provided 'page' query parameter
    const currentPage = parseInt(req.query.page, 10) || 1;

    const response = {
      code: httpStatus.OK,
      message: responseMessage.FILTER_SUCCESS,
      isSuccess: true,
      data: {
        ...users,
        currentPage, // Include the current page number
      },
    };

    res.json(response);
    // new ApiResponse(res, httpStatus.OK, responseMessage.FILTER_SUCCESS, users);
  } catch (error) {
    throw new Error(error);
  }
});


const getReviewsController = catchAsync(async (req, res) => {
  try {
    const admin = req.user;
    if (admin.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to access users reviews');
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userReviews = await adminService.getReviewsPostedByUsers(page, limit);
    new ApiResponse(res, httpStatus.OK, responseMessage.REVIEWS_SUCCESS, userReviews);
  } catch (error) {
    throw new Error(error);
  }
})
// Get List of particular users
const getUserById = catchAsync(async (req, res) => {
  const user = await adminService.getAdminListOfUsers(req.params.userId);
  const adminVerify = req.user;
  if (adminVerify.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get user data');
  }
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  };
  new ApiResponse(res, httpStatus.OK, responseMessage.USER_SUCCESS, user);

});


const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await adminService.getAllUsers(page, limit);
  const admin = req.user;

  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get user data');
  }

  // Calculate the current page based on the provided 'page' query parameter
  const currentPage = parseInt(req.query.page, 10) || 1;
  const response = {
    code: httpStatus.OK,
    message: responseMessage.GET_ALL_USERS_SUCCESS,
    isSuccess: true,
    data: {
      ...result,
      currentPage, // Include the current page number
    },
  };

  res.json(response);

});

const getAllLoadsForAdmin = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await adminService.getAllLoads(page, limit);
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get user data');
  }
  const currentPage = parseInt(req.query.page, 10) || 1;
  const response = {
    code: httpStatus.OK,
    message: responseMessage.GET_ALL_LOADS_SUCCESS,
    isSuccess: true,
    data: {
      ...result,
      currentPage, // Include the current page number
    },
  };
  res.json(response);
});


const getLoadByIdAdmin = catchAsync(async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await adminService.getLoadByIdInAdmin(loadId);
    const user = req.user;
    if (user.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get load data');
    };
    new ApiResponse(res, httpStatus.OK, responseMessage.SINGULAR_LOAD_MESSAGE, load);
  } catch (error) {
    throw new Error(error);
  }
})

const savedLoadsByCarrier = catchAsync(async (req, res) => {
  const { userId } = req.body;
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to access users reviews');
  }
  const validUser = await userService.getUserById(userId);
  if (!validUser) {
    throw new Error('User with this email not exists');
  };
  try {
    const user = await adminService.getUserWithSavedLoads(userId);
    if (user) {
      new ApiResponse(res, httpStatus.OK, responseMessage.CARRIER_SAVED_LOADS, user);
    }
  } catch (error) {
    throw new Error(error);
  }
})


const getAllTransactions = catchAsync(async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const currentPage = parseInt(req.body.page, 10) || 1;
    const result = await adminService.getAllTransactions(page, limit);

    const response = {
      code: httpStatus.OK,
      message: responseMessage.LIST_OF_ALL_TRANSACTIONS,
      isSuccess: true,
      data: {
        ...result,
        currentPage
      }
    };
    res.json(response);
  } catch (error) {
    throw new Error(error);
  }
})




const fetchMcNumbers = catchAsync(async (req, res) => {
  const { adminId } = req.params;
  const adminCheck = await adminService.getAdminById(adminId);
  if (!adminCheck) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  };
  const results = await mcCheckerService.fetchMcNumbersByAdmin(adminId);
  new ApiResponse(res, httpStatus.OK, responseMessage.MC_NUMBERS, results);
});

const updateMcChecker = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { safetyScore, dotNumber, riskScore } = req.body;
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to update mcData');
  }
  const updatedMcChecker = await mcCheckerService.updateMcChecker(userId, {
    safetyScore,
    riskScore,
    dotNumber
  });

  new ApiResponse(res, httpStatus.OK, responseMessage.MC_NUMBER_STATUS, updatedMcChecker);
});


const searchUserByMcNumber = catchAsync(async (req, res) => {
  try {
    // const { mcId } = req.params;
    const { mcNumber } = req.body;
    const result = await mcCheckerService.searchMcNumberService(mcNumber);
    new ApiResponse(res, httpStatus.OK, responseMessage.MC_NUMBER_DATA, result);
  } catch (error) {
    throw new Error(error);
  }
});


const getNummberOfUsers = catchAsync(async (req, res) => {
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to access user count');
  };
  try {
    const result = await adminService.getUserStatistics();
    new ApiResponse(res, httpStatus.OK, responseMessage.NUMBER_OF_USERS, result);
  } catch (error) {
    throw new Error(error);
  }
});


const getNummberOfLoads = catchAsync(async (req, res) => {
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to access user count');
  };
  try {
    const result = await adminService.getLoadStatistics();
    new ApiResponse(res, httpStatus.OK, responseMessage.NUMBER_OF_LOADS, result);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllLoadsByShipper = catchAsync(async (req, res) => {
  try {
    const { userId } = req.body;
    const user = req.user;

    if (user.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get loads by shipper id');
    }
    const loads = await loadService.getLoadsByShipper(userId);

    if (!loads) {
      throw new ApiError(httpStatus.NOT_FOUND);
    }

    const totalLoads = loads.length;
    res.status(httpStatus.OK).json({
      code: 200,
      message: `List of ${totalLoads} loads fetched successfully`,
      isSuccess: true,
      data: loads
    });

  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
});







module.exports = {
  getUserById,
  getAllUsers,
  registerAdmin,
  getAdminInfo,
  login,
  filterUsersByRoleInAdmin,
  filterUsersByMailInAdmin,
  getReviewsController,
  getAllLoadsForAdmin,
  getAllTransactions,
  editProfileDataForAdmin,
  fetchMcNumbers,
  updateMcChecker,
  searchUserByMcNumber,
  savedLoadsByCarrier,
  getNummberOfUsers,
  getNummberOfLoads,
  getAllLoadsByShipper,
  getLoadByIdAdmin
}
