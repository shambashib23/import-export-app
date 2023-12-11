const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { loadService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');
const { responseMessage } = require('../utils/common');
const pick = require('../utils/pick');
const { userService, locationService, mcCheckerService } = require('../services');
const { paymentService } = require('../services');
const { http } = require('winston');
const { User } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);





const createLoad = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const loadBody = req.body;
    const user = req.user;
    // Check if the authenticated user has the 'shipper' role
    if (user.role !== 'shipper') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only shippers are allowed to create loads');
    }
    loadBody.createdBy = userId;
    // Generate a random 8-digit number
    const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
    const loadId = `#${randomNumber}`;
    // Add the generated loadId to the loadBody
    loadBody.loadId = loadId;

    const calculatedDistance = await locationService.getDistanceByCoordinates(req.body);
    loadBody.loadDistance = calculatedDistance;


    // Call the service function to create the load
    const result = await loadService.createLoad(req.body);

    const response = {
      code: httpStatus.CREATED,
      message: 'Load created successfully!',
      isSuccess: true,
      data: result,
    };
    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error);
  }
});

const getAllLoads = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;
    const { locationFilter, pickupLocation, dropLocation } = req.body;

    if (user.role !== 'shipper') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only shippers are allowed to get loads');
    }
    const filters = {
      locationFilter,
      pickupLocation,
      dropLocation,
    };
    const loads = await loadService.getLoadsByShipperAndLocation(userId, filters);

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

const getSingularLoad = catchAsync(async (req, res) => {
  const singleLoad = await loadService.getLoadById(req.params.loadId);
  if (!singleLoad) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Load not found!');
  };
  new ApiResponse(res, httpStatus.OK, responseMessage.SINGULAR_LOAD_MESSAGE, singleLoad);
});


const editLoadById = async (req, res) => {
  const { loadId } = req.params;
  const verifyExistingLoad = await loadService.getLoadById(loadId);
  if (!verifyExistingLoad) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Load not found!');
  }
  const user = req.user;
  if (user.role !== 'shipper') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only shippers are allowed to edit loads');
  }
  const updatedLoadData = req.body;

  const updatedLoad = await loadService.editLoadByIdService(loadId, updatedLoadData);
  new ApiResponse(res, httpStatus.OK, responseMessage.EDIT_LOAD_SUCCESS, updatedLoad);
};


const createShippingAddressForShipper = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const addressData = req.body;

  const newAddress = await loadService.createShippingAddress(userId, addressData);

  new ApiResponse(res, httpStatus.OK, responseMessage.SHIPPER_ADDRESS, newAddress);
});


const deleteShippingAddressesForShipper = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { addressIds } = req.body;

  const result = await loadService.deleteShippingAddresses(userId, addressIds);

  new ApiResponse(res, httpStatus.OK, responseMessage.DELETE_SHIPPER_ADDRESS, result);
});


const getSchedulesFromShipper = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const userSchedules = await loadService.getUserSchedules(userId);
  new ApiResponse(res, httpStatus.OK, responseMessage.GET_SHIPPER_ADDRESS, userSchedules);
})


const editShippingAddressForShipper = catchAsync(async (req, res) => {
  const { userId, addressId } = req.params;
  const updatedAddress = req.body;
  const editedAddress = await loadService.editShippingAddress(userId, addressId, updatedAddress);

  new ApiResponse(res, httpStatus.OK, responseMessage.EDIT_SHIPPER_ADDRESS, editedAddress);
});


// Payment Request
const createPaymentRequestCarrier = catchAsync(async (req, res) => {
  try {
    const { loadId, id, rate, docUrl } = req.body;

    const existingLoad = await loadService.getLoadById(loadId);
    if (!existingLoad) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Load with provided loadId does not exist!');
    }

    const validShipper = await userService.getUserById(id);

    if (!validShipper) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Shipper with provided shipperId does not exist!');
    }
    const { carrierId } = req.params;
    const carrier = req.params.carrierId;

    if (!carrier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Carrier with provided carrierId does not exist!');
    }
    // console.log('carrier object', carrier);
    const paymentRequest = await paymentService.createPaymentRequest(carrierId, loadId, id, rate, docUrl);
    console.log('payment', paymentRequest);
    new ApiResponse(res, httpStatus.OK, responseMessage.CREATE_PAYMENT_REQUEST, paymentRequest);
  } catch (error) {
    throw new ApiError(error);
  }
});


const fetchPaymentRequestsForShipper = catchAsync(async (req, res) => {
  const { shipperId } = req.params;
  const validShipperCheck = await userService.getUserById(shipperId);
  if (!validShipperCheck) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipper dont exist!');
  }
  try {
    const paymentRequests = await paymentService.fetchPaymentRequests(shipperId);
    new ApiResponse(res, httpStatus.OK, responseMessage.PAYMENT_REQUEST_SUCCESS, paymentRequests);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, error);
  }
});

const fetchPaymentRequestsForCarrier = catchAsync(async (req, res) => {
  const { carrierId } = req.params;
  const validCarrierCheck = await userService.getUserById(carrierId);
  if (!validCarrierCheck) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipper dont exist!');
  }
  try {
    const paymentRequests = await paymentService.fetchPaymentRequestsForCarrier(carrierId);
    new ApiResponse(res, httpStatus.OK, responseMessage.PAYMENT_REQUEST_SUCCESS, paymentRequests);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, error);
  }
});





// const createPayment = async (req, res) => {
//   try {
//     const params = req.body;
//     const { userId } = req.params;
//     const user = await userService.getUserById(userId);
//     console.log('user', user);
//     if (user.role !== 'shipper') {
//       throw new ApiError(httpStatus.FORBIDDEN, 'Only shippers are allowed to pay via this endpoint!');
//     }
//     // Extract the shipper's email
//     const shipperEmail = user.email;
//     const paymentResponse = await paymentService.processOneTimePayment({
//       ...params,
//       email: shipperEmail
//     });
//     console.log('payment resposne', paymentResponse);

//     const successResponse = {
//       code: 200,
//       message: 'Payment successful',
//       isSuccess: true,
//       data: paymentResponse,
//     };
//     return res.json(successResponse);
//   } catch (error) {
//     const errorResponse = {
//       code: 400,
//       message: 'Payment failed',
//       isSuccess: false,
//       error: error.message,
//     };

//     return res.status(400).json(errorResponse);
//   }
// };


const updateLoadIsCovered = catchAsync(async (req, res) => {
  const { loadId } = req.params;
  const { isCovered } = req.body;
  const load = await loadService.updateLoadIsCovered(loadId, isCovered);
  new ApiResponse(res, httpStatus.OK, responseMessage.LOAD_UPDATE, load);
});

// Filter controller
const getFilteredLoadsForCarrier = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;
    if (user.role !== 'carrier') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get filtered loads');
    }
    const { trailerTypes, minWeight, maxWeight, minPrice, maxPrice, pickupLocation, pickupLocationName, dropLocationName, dropLocation, date, packageType, companyNames, minRate, maxRate, loadRequirement, loadType, pickupRadius, dropRadius, minLoadLength, maxLoadLength, minLoadDistance, maxLoadDistance, sortBy, sortOrder } = req.body;
    const filterData = req.body;
    const validSortFields = ['amount', 'ageOfLoadPost', 'ratePerMile', 'quantity', 'loadLength', 'loadDistance'];
    await loadService.saveFilterForCarriers(userId, filterData);
    const savedLoads = user.savedLoad.map(loadId => loadId.toString());
    const filteredLoads = await loadService.searchFilterLoadsForCarrier(userId, trailerTypes, minWeight, maxWeight, minPrice, maxPrice, pickupLocation, pickupLocationName, dropLocationName, dropLocation, date, packageType, companyNames, minRate, maxRate, loadRequirement, loadType, pickupRadius, dropRadius, minLoadLength, maxLoadLength, minLoadDistance, maxLoadDistance, sortBy, sortOrder);
    filteredLoads.forEach(load => {
      load.isSaved = savedLoads.includes(load._id.toString());
    })
    const filteredLoadsLength = filteredLoads.length;
    new ApiResponse(res, httpStatus.OK, `${filteredLoadsLength} Loads filtered & fetched successfully!`, filteredLoads);
  } catch (error) {
    throw new Error(error);
  }
});


const getFilteredLoadsByPickupLocationAndDate = catchAsync(async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'carrier') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get filtered loads');
    }
    const { pickupLocation, date } = req.body;
    const savedLoads = user.savedLoad.map(loadId => loadId.toString());
    const filteredLoads = await loadService.secondSearchFilterLoadsForCarrier(pickupLocation, date);
    filteredLoads.forEach(load => {
      load.isSaved = savedLoads.includes(load._id.toString());
    });
    const filteredLoadsLength = filteredLoads.length;
    new ApiResponse(res, httpStatus.OK, `${filteredLoadsLength} Loads filtered & fetched successfully!`, filteredLoads);
  } catch (error) {
    throw new Error(error);
  }
});


const getRecentSearches = catchAsync(async (req, res) => {
  try {
    const user = req.user;
    const fetchRecentSearches = await userService.getUserRecentSearches(user.id);
    new ApiResponse(res, httpStatus.OK, `Recent searches fetched successfully!`, fetchRecentSearches);
  } catch (error) {
    throw new Error(error);
  }
})



const saveFiltersForCarrier = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;
    console.log('user', req.user);
    if (user.role !== 'carrier') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get filtered loads');
    }
    const { trailerTypes, minWeight, maxWeight, minPrice, maxPrice, pickupLocation, dropLocation, date, packageType, companyNames, minRate, maxRate, loadRequirement, loadType, pickupRadius, dropRadius, minLoadLength, maxLoadLength, minLoadDistance, maxLoadDistance, sortBy, sortOrder } = req.body;
    const filterData = req.body;
    const result = await loadService.saveFilterForCarriers(userId, filterData);
    console.log('results', result);
    const savedResult = await loadService.toggleSavedFilter(result._id, user.id);
    new ApiResponse(res, httpStatus.OK, `Filter saved successfully!`, savedResult);
  } catch (error) {
    throw new Error(error);
  }
});



const getRecentFilters = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = req.user;
  if (user.role !== 'carrier') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get recent filters!');
  }
  try {
    const filters = await loadService.getSavedFiltersForCarriers(userId);

    if (filters && filters.length > 0) {
      const response = {
        code: httpStatus.OK,
        message: responseMessage.RECENT_SAVED_FILTERS,
        isSuccess: true,
        data: filters,
      };
      res.json(response);
    } else {
      const response = {
        code: httpStatus.OK,
        message: 'NO SAVED FILTERS FOUND',
        isSuccess: true,
        data: filters,
      };
      res.json(response);
    }
  } catch (error) {
    throw new Error(error);
  }
});



const deleteSavedFilters = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { filterIds } = req.body;
  const user = req.user;

  if (user.role !== 'carrier') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get recent filters!');
  }
  try {
    if (!filterIds || filterIds.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No filter IDs provided for deletion' });
    }
    const result = await loadService.deleteFiltersForCarriers(userId, filterIds);
    if (result.deletedCount > 0) {
      const response = {
        code: httpStatus.OK,
        message: 'Filters deleted successfully',
        isSuccess: true,
        data: {
          deletedCount: result.deletedCount,
        },
      };
      res.json(response);
    } else {
      res.status(404).json({ error: 'No filters were deleted' });
    }
  } catch (error) {
    throw new Error(error);
  }
});

const getSortedLoadsForCarrier = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const carrierProfile = await userService.getUserData(userId);
    if (!carrierProfile) {
      throw new ApiError('Carrier Profile do not exist!');
    }
    const user = req.user;
    if (user.role !== 'carrier') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get loads');
    };
    const { sortBy } = req.body;
    const validSortFields = ['amount', 'ageOfLoadPost', 'ratePerMile', 'quantity'];

    if (!Array.isArray(sortBy) || sortBy.length === 0 || !sortBy.every(field => validSortFields.includes(field))) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid sorting criteria! Please provide valid fields.');
    }

    const loads = await loadService.getLoadsBySorting(sortBy);
    return new ApiResponse(res, httpStatus.OK, responseMessage.SORT_LOAD_SUCCESS, loads);


  } catch (error) {
    throw new Error(error);
  }
})



// filter by isCovered
const getLoadsFilteredByIsCovered = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = req.user;

  if (user.role !== 'shipper') {
    throw new Error('Only shippers are allowed to access this endpoint!');
  }
  const filter = pick(req.query, ['isCovered']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await loadService.filterLoads(filter, options, userId);

  // Calculate the current page based on the provided 'page' query parameter
  const currentPage = parseInt(req.query.page, 10) || 1;

  const response = {
    code: httpStatus.OK,
    message: responseMessage.FILTER_LOAD_SUCCESS,
    isSuccess: true,
    data: {
      ...result,
      currentPage, // Include the current page number
    },
  };

  res.json(response);
})


const saveFilterForUser = catchAsync(async (req, res) => {
  try {
    const { filterId } = req.params;
    const user = req.user;
    // Check if the user's role is "carrier"
    if (user.role !== 'carrier') {
      throw new Error('Only carriers are allowed to save/unsave loads.');
    }
    if (!user) {
      throw new Error('User not found');
    }
    const savedFilter = await loadService.toggleSavedFilter(filterId, user.id);

    new ApiResponse(res, httpStatus.OK, responseMessage.FILTER_SAVE_SUCCESS, savedFilter);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
});

const getSavedFiltersForCarriers = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    // Call the service to get saved cargos for the user
    const savedFilters = await loadService.getSavedFiltersForUser(userId);
    const numberOfSavedLoads = savedFilters.length;
    new ApiResponse(res, httpStatus.OK, `${numberOfSavedLoads} Saved Filters Retrieved Successfully`, savedFilters);
  } catch (error) {
    throw new Error('Error fetching saved cargos');
  }
});

const saveLoadForCarrier = catchAsync(async (req, res) => {
  try {
    const { loadId } = req.params;
    const user = req.user;

    // Check if the user's role is "carrier"
    if (user.role !== 'carrier') {
      throw new Error('Only carriers are allowed to save/unsave loads.');
    }
    if (!user) {
      throw new Error('User not found');
    }
    const savedLoad = await loadService.toggleSavedLoad(loadId, user.id);
    new ApiResponse(res, httpStatus.OK, responseMessage.LOAD_SAVE_SUCCESS, savedLoad);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
});

const getSavedCargos = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;

    // Call the service to get saved cargos for the user
    const savedCargos = await loadService.getSavedCargosForUser(userId);

    const numberOfSavedLoads = savedCargos.length;

    new ApiResponse(res, httpStatus.OK, `${numberOfSavedLoads} Saved Cargos Retrieved Successfully`, savedCargos);
  } catch (error) {
    throw new Error('Error fetching saved cargos');
  }
});

const editProfileData = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { name, email, phoneNumber, profilePicUrl } = req.body;
  const updatedData = {
    name,
    email,
    phoneNumber,
    profilePicUrl
  };
  const updatedUser = await userService.updateProfile(userId, updatedData);
  new ApiResponse(res, httpStatus.OK, responseMessage.EDIT_PROFILE_SUCCESS, updatedUser);
});

const getShipperProfileData = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const shipperProfile = await userService.getUserData(userId);
  if (!shipperProfile) {
    throw new ApiError('Shipper Profile do not exists!');
  }

  new ApiResponse(res, httpStatus.OK, responseMessage.PROFILE_DATA, shipperProfile);
});

const deleteShipperProfile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const shipperProfile = await userService.deleteUserById(userId);
  if (!shipperProfile) {
    throw new ApiError('Shipper Profile do not exists!');
  };
  new ApiResponse(res, httpStatus.OK, 'User Profile deleted successfully!', shipperProfile);

})

const getRecentLoadsForCarriers = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;
    if (user.role !== 'carrier') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get recent filters!');
    }


    const recentLoads = await loadService.getRecentLoads(user);
    const numberOfRecentLoads = recentLoads.length;

    new ApiResponse(res, 200, `${numberOfRecentLoads} recent loads retrieved successfully`, recentLoads);
  } catch (error) {
    // Handle errors and send an appropriate response
    console.error(error);
    new ApiResponse(res, 500, 'Error fetching recent loads', null);
  }
});

const getCompanyNamesForCarriers = catchAsync(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (user.role !== 'carrier') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only carriers are allowed to get shipping companies list!');
    }
    const companyNames = await loadService.getCompanyNamesByUserId(userId);
    res.status(httpStatus.OK).json({
      code: 200,
      message: `List of Shipping Companies fetched successfully`,
      isSuccess: true,
      data: companyNames
    });
  } catch (error) {
    throw new Error(error);
  }
})


const deleteLoadsForShippersById = catchAsync(async (req, res) => {
  try {
    const { loadId } = req.params;
    const singleLoad = await loadService.getLoadById(loadId);
    if (!singleLoad) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Load not found by this id!');
    };

    const deleteLoad = await loadService.deleteLoadById(loadId);
    if (!deleteLoad) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Load not found by this id!')
    }
    new ApiResponse(res, httpStatus.OK, responseMessage.LOAD_DELETION, deleteLoad);


  } catch (error) {
    throw new ApiError(error);
  }

});



// Payment Related Controllers

const addCardForShipper = catchAsync(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found by this id!')
  }
  if (user.role !== 'shipper') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only shippers are allowed to save cards');
  }
  console.log(req.body);

  const saveCardForShipper = await paymentService.createCustomerCard(req.body);
  return new ApiResponse(res, httpStatus.CREATED, "Card added successfully", saveCardForShipper)
});

const addBankAccountForCarrier = catchAsync(async (req, res) => {
  const user = req.user;
  // Bank account details provided in the request body
  const { accountNumber, routingNumber } = req.body;
  // Call the service to save the bank account details to the user's profile
  const updatedUser = await paymentService.saveBankAccountForCarrier(user, accountNumber, routingNumber);
  res.status(200).json({
    code: 200,
    message: 'Bank Account Details Saved Successfully!',
    isSuccess: true,
    data: updatedUser,
  });
})


const listSaveCards = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const verifyUser = req.params.userId;
  if (!verifyUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found by this id!')
  }
  let savedPaymentMethod = [];
  if (req.user.stripeCustomerId != "") {
    savedPaymentMethod = await paymentService.ListPaymentMethods(req.user.stripeCustomerId);
  }
  return res.send({ code: 200, message: 'List of saved cards fetched successfully!', isSuccess: true, savedPaymentMethod });
});


const initiatePaymentForShipper = catchAsync(async (req, res) => {
  // const { }
  const { userId } = req.params;
  const user = req.user;
  const requestId = req.body.requestId;
  const cardId = req.body.cardId;
  const paymentRequest = await paymentService.fetchPaymentRequestById(requestId);
  console.log('payment', paymentRequest);

  if (paymentRequest.paymentMode === "Paid") {
    throw new ApiError(httpStatus.CONFLICT, "Payment is already done for this payment request")
  }
  const payment = await paymentService.shipperPaymentService(requestId, user, cardId);
  return new ApiResponse(res, httpStatus.CREATED, "Paid Successfully!", payment);
});





// mc checker app
const getUserByMcNumber = catchAsync(async (req, res) => {
  try {
    const { mcNumber } = req.body;
    const user = req.user;
    if (user.role !== 'shipper') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Only shippers are allowed to fetch carriers by McNumbers');
    };
    const mcVerifiedCarrier = await mcCheckerService.searchMcNumberService(mcNumber);
    new ApiResponse(res, httpStatus.OK, responseMessage.MC_NUMBER_DATA, mcVerifiedCarrier);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error);
  }
})








module.exports = {
  createLoad,
  getAllLoads,
  getSingularLoad,
  updateLoadIsCovered,
  getLoadsFilteredByIsCovered,
  saveLoadForCarrier,
  getSavedCargos,
  getFilteredLoadsForCarrier,
  editProfileData,
  getRecentLoadsForCarriers,
  getShipperProfileData,
  getCompanyNamesForCarriers,
  deleteLoadsForShippersById,
  getSortedLoadsForCarrier,
  getRecentFilters,
  deleteSavedFilters,
  createShippingAddressForShipper,
  deleteShippingAddressesForShipper,
  getSchedulesFromShipper,
  editShippingAddressForShipper,
  createPaymentRequestCarrier,
  editLoadById,
  fetchPaymentRequestsForShipper,
  addCardForShipper,
  listSaveCards,
  initiatePaymentForShipper,
  saveFilterForUser,
  fetchPaymentRequestsForCarrier,
  addBankAccountForCarrier,
  getSavedFiltersForCarriers,
  getUserByMcNumber,
  saveFiltersForCarrier,
  getFilteredLoadsByPickupLocationAndDate,
  getRecentSearches,
  deleteShipperProfile
};


