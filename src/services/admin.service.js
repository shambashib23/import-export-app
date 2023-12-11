const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const userService = require('./user.service');
const { User } = require('../models');
// const { paginate } = require('../models/plugins');
const { Admin } = require('../models');
const { Load } = require('../models');
const Payment = require('../models/payment.request.model');
const ApiResponse = require('../utils/ApiResponse');
const { responseMessage } = require('../utils/common');
const Review = require('../models/review.model');
const NodeCache = require("node-cache");
const userCache = new NodeCache();



/**
 * Create a admin
 * @param {Object} adminBody
 * @returns {Promise<Admin>}
 */

const createAdmin = async (adminBody) => {
  const admin = await User.create(adminBody);
  // Check if an admin with the same email already exists
  return admin;
}

/**
 * Get admin by email
 * @param {string} email
 * @returns {Promise<Admin>}
 */
const getAdminByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Get admin by email
 * @param {string} email
 * @returns {Promise<Admin>}
 */
const getAdminById = async (id) => {
  return User.findById(id);
};
const updateProfileAdmin = async (adminId, updatedData) => {
  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error('User not found');
    }
    if (updatedData.email && (await User.isEmailTaken(updatedData.email, adminId))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    if (updatedData.email) {
      admin.email = updatedData.email;
    }
    if (updatedData.fullName) {
      admin.fullName = updatedData.fullName;
    }
    if (updatedData.password) {
      admin.password = updatedData.password;
    }
    // Save the updated user
    await admin.save();
    return admin;
  } catch (error) {
    throw error;
  }
};


/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Admin>}
 */
const loginAdminWithEmailAndPassword = async (fullName, email, password) => {
  const admin = await User.findOne({ email });
  if (!admin || !(await admin.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return admin;
};




/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */

const getAdminListOfUsers = async (id) => {
  const user = await userService.getUserById(id);
  return user;
}


// Get List of all users for admin
/**
 * Get user by id
 * @query page number
 * @returns {Promise<User>}
 */
const getAllUsers = async (page, limit) => {
  const cacheKey = `users_${page}_${limit}`;
  const cachedUsers = userCache.get(cacheKey);
  if (cachedUsers) {
    console.log("users cached", cachedUsers);
    return cachedUsers;
  }
  const options = {
    page: page || 1,
    limit: limit || 10,
    sort: { createdAt: -1 },
  };
  const allUsers = await User.paginate({}, options);
  // Store the fetched users in the cache with a TTL (time to live)
  userCache.set(cacheKey, allUsers, /* TTL in seconds */ 60);
  return allUsers
}





// Get Load Details by Admin




/**
 * Filter users by role
 * @param {string} role - The role to filter by
 * @returns {Promise<Array>} - A list of users with the specified role
 */
const filterUsersByRole = async (role, limit, page) => {
  try {
    const options = {
      limit: parseInt(limit, 10) || 10,
      page: parseInt(page, 10) || 1,
    };
    const users = await User.paginate({ role }, options);
    return users;
  } catch (error) {
    throw error;
  }
};

/**
 * Filter users by role
 * @param {string} isEmailVerified - Verified users to filter by
 * @returns {Promise<Array>} - A list of users with verified emails!
 */
const filterUsersByMailVerification = async (isEmailVerified, limit, page) => {
  try {
    const options = {
      limit: parseInt(limit, 10) || 10,
      page: parseInt(page, 10) || 1,
    };
    const users = await User.paginate({ isEmailVerified }, options);
    return users;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Feedbacks
 *
 * @returns {Promise<User>}
 */
const getReviewsPostedByUsers = async (page, limit) => {
  try {
    const options = {
      page: page || 1,
      limit: limit || 10,
    };
    const reviews = await Review.paginate({}, options);
    return reviews;
  } catch (error) {
    throw error;
  }
};


/**
 * returns list of loads
 * @returns {Promise<Load>}
 */
const getAllLoads = async (page, limit) => {
  const options = {
    page: page || 1, // Current page number
    limit: limit || 10, // Number of results per page
    sort: { createdAt: -1 },
  };

  const allLoads = await Load.paginate({}, options);
  return allLoads;
}


const getLoadByIdInAdmin = async (id) => {
  try {
    const load = await Load.findById(id);
    return load;
  } catch (error) {
    throw error;
  }
}

const getAllTransactions = async (page, limit) => {
  const options = {
    page: page || 1, // Current page number
    limit: limit || 10, // Number of results per page
  };
  const allTransactions = await Payment.paginate({}, options);
  return allTransactions;
}


const getUserWithSavedLoads = async (userId) => {
  try {
    // Modify the code based on your User model
    const user = await User.findById(userId).populate('savedLoad');

    return user;
  } catch (error) {
    throw error;
  }
};


const getUserStatistics = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const totalShippers = await User.countDocuments({ role: 'shipper' });
    const totalCarriers = await User.countDocuments({ role: 'carrier' });

    return {
      totalUsers,
      totalShippers,
      totalCarriers,
    };
  } catch (error) {
    throw error;
  }
};

const getLoadStatistics = async () => {
  try {
    const totalLoads = await Load.countDocuments();
    return {
      totalLoads
    };
  } catch (error) {
    throw error;
  }
};








module.exports = {
  getAdminListOfUsers,
  getAllUsers,
  createAdmin,
  getAdminByEmail,
  getAdminById,
  loginAdminWithEmailAndPassword,
  filterUsersByRole,
  filterUsersByMailVerification,
  getReviewsPostedByUsers,
  getAllLoads,
  getAllTransactions,
  updateProfileAdmin,
  getUserWithSavedLoads,
  getUserStatistics,
  getLoadStatistics,
  getLoadByIdInAdmin
}
