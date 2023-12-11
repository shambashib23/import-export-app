const httpStatus = require('http-status');
const { User } = require('../models');
const { McChecker } = require('../models');
const ApiError = require('../utils/ApiError');
const paymentService = require('./payment.service');
const mongoose = require('mongoose');

/**
 * Create a shipper
 * @param {Object} userBody
 * @returns {Promise<Shipper>}
 */


const createUser = async (userBody) => {
  // Step 1: Create a Stripe customer
  const stripeCustomerId = await paymentService.createCustomer(userBody);
  // Step 2: Create the admin with the Stripe customer ID
  userBody.stripeCustomerId = stripeCustomerId;
  const { email } = userBody;
  // Check if a user with the same email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Handle the case where the email is already in use
    throw new Error('Email is already in use');
  }
  // Create the user if the email is not in use
  const user = await User.create(userBody);
  // Use a variable to store mcChecker value
  // const mcNumber = mcChecker;
  // // Populate the mcChecker model
  // const mcCheckerInstance = new McChecker({ mcNumber, carrierData: user, carrierId: user._id });
  // await mcCheckerInstance.save();
  return user;
}




/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  // const userId = mongoose.Types.ObjectId(id);

  return await User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Get a user by OTP
 * @param {string} otp - The OTP to search for
 * @returns {Promise<User|null>} A promise that resolves to the user if found, or null if not found
 */
const getUserByOtp = async (otp) => {
  try {
    const user = await User.findOne({ otp });
    return user;
  } catch (error) {
    throw new Error('Error while finding user by OTP');
  }
};

/**
 * Get a user by OTP
 * @param {string} otp - The OTP to search for
 * @returns {Promise<User|null>} A promise that resolves to the user if found, or null if not found
 */
const getForgetPasswordOtpForUser = async (passwordResetOtp) => {
  try {
    const user = await User.findOne({ passwordResetOtp });
    return user;
  } catch (error) {
    new Error('Error while finding user by OTP');
  }
}







/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} password
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, password) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  user.password = password;
  await user.save();
  return user;
};


// const updateUserPasswordById = async (userId, newPassword) => {
//   const user = await getUserById(userId);
//   console.log('update user password service', user);
//   if (!user) {
//     new ApiError(httpStatus.NOT_FOUND, 'User not found');
//   }
//   // Update the user's password
//   user.password = newPassword;
//   await user.save();
//   return user;
// };

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};



const updateUserPasswordById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};




/**
 * Update the user's profile information.
 * @param {ObjectId} userId - The ID of the user to be updated.
 * @param {Object} updatedData - An object containing the updated data (name, email, phoneNumber).
 * @returns {Promise<User>} - The updated user object.
 */
const updateProfile = async (userId, updatedData) => {
  try {
    const user = await User.findById(userId);


    if (!user) {
      throw new Error('User not found');
    }

    if (updatedData.email && (await User.isEmailTaken(updatedData.email, userId))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    // Update profile data
    if (updatedData.name) {
      user.fullName = updatedData.name;
    }
    if (updatedData.email) {
      user.email = updatedData.email;
    }
    if (updatedData.phoneNumber) {
      user.phoneNumber = updatedData.phoneNumber;
    }
    if (updatedData.profilePicUrl) {
      user.profilePicUrl = updatedData.profilePicUrl;
    }

    // Save the updated user
    await user.save();

    return user;
  } catch (error) {
    throw error;
  }
};


const getUserData = async (userId) => {
  const user = await User.findById(userId);
  return user;
}

// /**
//  * Delete load by id
//  * @param {ObjectId} id
//  * @returns {Promise<Load>}
//  */

// const deleteUserById = async (loadId) => {
//   try {
//     const deleteLoad = await Load.findByIdAndDelete(loadId);
//     return deleteLoad;

//   } catch (error) {
//     throw error
//   }
// };


/**
 * Find users by their company names.
 * @param {string} shipperName - The name of the company to search for.
 * @returns {Promise<Array>} - A promise that resolves to an array of users.
 */
const findUsersByCompanyName = async (companyName) => {
  try {
    // Use a case-insensitive regular expression to perform a partial match on the company name
    const users = await User.find({
      companyName: { $regex: new RegExp(companyName, 'i') },
    });
    console.log('shippers', users);

    return users;
  } catch (error) {
    throw error;
  }
};



const findUserByMcNumber = async (mcNumber) => {
  try {
    const user = await User.findOne({ mcNumber });
    if (!user) {
      throw new Error('User with the provided mcNumber not found.');
    }
    return user;
  } catch (error) {
    throw error;
  }
};


const getUserRecentSearches = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user.recentSearchedLocations;
  } catch (error) {
    throw error;
  }
}



module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByOtp,
  updateUserPasswordById,
  getForgetPasswordOtpForUser,
  getUserByEmail,
  updateUserById,
  updateProfile,
  deleteUserById,
  getUserData,
  findUsersByCompanyName,
  findUserByMcNumber,
  getUserRecentSearches
};
