const httpStatus = require('http-status');
const { Load } = require('../models');
const { User } = require('../models');
const { Filter } = require('../models');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const NodeCache = require("node-cache");
const loadCache = new NodeCache();

const { userService } = require('../services');
const { findByIdAndDelete } = require('../models/token.model');

/**
 * Create a load by a valid shipper!
 * @param {Object} loadBody
 * @returns {Promise<Load>}
 */

const createLoad = async (loadBody) => {
  try {
    return Load.create(loadBody);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Could not create the load', error);
  }
};

/**
 * returns list of loads
 * @returns {Promise<Load>}
 */
const getLoadsByShipper = async (userId) => {
  try {
    const loads = await Load.find({
      createdBy: userId
    });
    return loads;
  } catch (error) {
    throw error;
  }
};



/**
 * returns list of loads
 * @returns {Promise<Load>}
 */
const getLoadsByShipperAndLocation = async (userId, filters) => {
  try {
    const { locationFilter, pickupLocation, dropLocation } = filters;

    if (locationFilter) {
      // If locationFilter is true, match coordinates
      const loads = await Load.find({
        createdBy: userId,
        $or: [
          {
            'pickupLocation.coordinates': { $eq: pickupLocation },
          },
          {
            'dropLocation.coordinates': { $eq: dropLocation },
          },
        ],
      });
      return loads;
    } else {
      // If locationFilter is false, run the find query with userId as the only filter
      const loads = await Load.find({ createdBy: userId });
      return loads;
    }
  } catch (error) {
    throw error;
  }
};



/**
 * Get load by id
 * @param {ObjectId} id
 * @returns {Promise<Load>}
 */

const getLoadById = async (id) => {
  return Load.findById(id);
}


const editLoadByIdService = async (loadId, updatedLoadData) => {
  try {
    const load = await Load.findByIdAndUpdate(loadId, updatedLoadData, { new: true });
    if (!load) {
      throw new Error('Load not found');
    }
    return load;
  } catch (error) {
    throw error;
  }
}



/**
 * Create a new shipping address for a user.
 * @param {ObjectId} userId - The user's ID for whom the address is created.
 * @param {Object} addressData - The shipping address data, including companyFullName, address, city, state, and zip.
 * @returns {Promise<Object>} - The created shipping address.
 */
const createShippingAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  // Create a new shipping address
  const newAddress = {
    companyFullName: addressData.companyFullName,
    address: addressData.address,
    city: addressData.city,
    state: addressData.state,
    zip: addressData.zip,
  };
  user.activeShippingAddress.push(newAddress);
  await user.save();
  return newAddress;
};


const getUserSchedules = async (userId) => {
  // Retrieve the user by their ID
  const user = await User.findById(userId);

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: 'User not found' });
  }

  // Access the user's schedules from their object
  const schedules = user.activeShippingAddress;
  return schedules;
}

/**
 * Delete one or multiple shipping addresses for a user.
 * @param {ObjectId} userId - The user's ID for whom the address is deleted.
 * @param {Array} addressIds - An array of shipping address IDs to be deleted.
 * @returns {Promise<Object>} - A message indicating the status of the deletion.
 */
const deleteShippingAddresses = async (userId, addressIds) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  for (const addressId of addressIds) {
    const addressIndex = user.activeShippingAddress.findIndex((address) => address._id == addressId);

    if (addressIndex !== -1) {
      user.activeShippingAddress.splice(addressIndex, 1);
    }
  }
  await user.save();
  return user;
};


/**
 * Edit a shipping address for a shipper.
 * @param {ObjectId} userId - The user's ID.
 * @param {ObjectId} addressId - The ID of the shipping address to edit.
 * @param {Object} updatedAddress - The updated shipping address data.
 * @returns {Promise<Object>} - The edited shipping address.
 */
const editShippingAddress = async (userId, addressId, updatedAddress) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const addressIndex = user.activeShippingAddress.findIndex((address) => address._id == addressId);

  if (addressIndex === -1) {
    throw new Error('Shipping address not found');
  }

  // Update the shipping address
  user.activeShippingAddress[addressIndex].companyFullName = updatedAddress.companyFullName;
  user.activeShippingAddress[addressIndex].address = updatedAddress.address;
  user.activeShippingAddress[addressIndex].city = updatedAddress.city;
  user.activeShippingAddress[addressIndex].state = updatedAddress.state;
  user.activeShippingAddress[addressIndex].zip = updatedAddress.zip;

  await user.save();

  return user.activeShippingAddress[addressIndex];
};





/**
 * Get load by its loadId
 * @param {ObjectId} loadId
 * @returns {Promise<Load>}
 */

const getLoadByDynamicId = async (loadId) => {
  try {
    const loadById = await Load.find({ loadId });
    return loadById;
  } catch (error) {
    throw error;
  }
}

/**
 * Update the 'isCovered' attribute of a load by ID
 * @param {ObjectId} id - Load ID
 * @param {boolean} isCovered - New value for 'isCovered'
 * @returns {Promise<Load>}
 */
const updateLoadIsCovered = async (loadId, isCovered) => {
  const load = await getLoadById(loadId);
  load.isCovered = isCovered;
  await load.save();
  return load;
};

/**
 * Query for loads
 * @param {Object} filter - Mongo filter
 * @returns {Promise<QueryResult>}
 */
const filterLoads = async (filter, options, userId) => {
  try {
    const loads = await Load.paginate({
      createdBy: userId,
      ...filter, // Any other filtering conditions you need
    },
      options
    );
    return loads;
  } catch (error) {
    throw error;
  }
}


/**
 * Save a load and update isSaved flag and savedBy array.
 * @param {ObjectId} loadId - The ID of the load to save.
 * @param {ObjectId} userId - The ID of the user who is saving the load.
 * @returns {Promise<Load>} - The updated load.
 */

const toggleSavedLoad = async (loadId, userId) => {
  try {
    // Find the load by ID
    const load = await Load.findById(loadId);

    if (!load) {
      throw new Error('Load not found');
    }
    // Find the user by ID
    const user = await userService.getUserById(userId);

    // Check if the loadId is present in the user's savedLoad array
    const isLoadSaved = user.savedLoad.includes(loadId);

    // Update the isSaved field of the load
    load.isSaved = !isLoadSaved;

    // Save the updated load
    await load.save();


    if (isLoadSaved) {
      // Unsave the load
      await User.findByIdAndUpdate(
        userId,
        { $pull: { savedLoad: loadId } },
        { new: true }
      );
    } else {
      // Save the load
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { savedLoad: loadId } },
        { new: true }
      );
    }

    return load;
  } catch (error) {
    throw error;
  }

}


const getSavedCargosForUser = async (userId) => {
  try {
    // Find the user by ID and populate the savedLoad field to get load details
    const user = await User.findById(userId).populate('savedLoad');

    if (!user) {
      throw new Error('User not found');
    }

    // Extract saved loads from the user
    const savedLoads = user.savedLoad;

    // Create an array to store cargo details
    const savedCargos = [];

    // Fetch details of saved loads
    for (const savedLoad of savedLoads) {
      const cargo = await Load.findById(savedLoad._id);
      if (cargo) {
        savedCargos.push(cargo);
      }
    }

    return savedCargos;
  } catch (error) {
    throw error;
  }
};


// Filter Loads service for carriers
/**
 * Query for loads on different params
 * @body {Object} filter - Mongo filter
 * @returns {Promise<QueryResult>}
 */

const searchFilterLoadsForCarrier = async (userId, trailerTypes, minWeight, maxWeight, minPrice, maxPrice, pickupLocation, pickupLocationName, dropLocationName, dropLocation, date, packageType, companyNames, minRate, maxRate, loadRequirement, loadType, pickupRadius, dropRadius, minLoadLength, maxLoadLength, minLoadDistance, maxLoadDistance, sortBy, sortOrder) => {
  try {
    const user = await User.findById(userId);
    if (user.role != 'carrier') {
      throw new Error('Carrier not found');
    }
    const handleRecentlySearchedLocations = (coordinates, locationName) => {
      const newSearch = {
        type: 'Point',
        coordinates,
        locationName,
      };

      // Remove oldest searches if the array length exceeds 3
      if (user.recentSearchedLocations.length >= 3) {
        user.recentSearchedLocations.shift();
      }

      // Add the new search to the array
      user.recentSearchedLocations.push(newSearch);
    };
    const matchQuery = {
      isCovered: false,
      // 'pickupLocation.coordinates': sourceLocation
    };

    if (trailerTypes && trailerTypes.length > 0) {
      matchQuery.trailerType = { $in: trailerTypes };
    }

    if (minWeight !== undefined && maxWeight !== undefined) {
      matchQuery.quantity = { $gte: minWeight, $lte: maxWeight };
    } else if (minWeight !== undefined) {
      matchQuery.quantity = { $gte: minWeight };
    } else if (maxWeight !== undefined) {
      matchQuery.quantity = { $lte: maxWeight };
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      matchQuery.amount = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice !== undefined) {
      matchQuery.amount = { $gte: minPrice };
    } else if (maxPrice !== undefined) {
      matchQuery.amount = { $lte: maxPrice };
    }


    if ((pickupLocation && pickupLocation.length === 2) || (dropLocation && dropLocation.length === 2)) {
      // Either pickupLocation or dropLocation is provided

      const geoWithinQuery = {};

      if (pickupLocation && pickupLocation.length === 2) {
        geoWithinQuery['pickupLocation.coordinates'] = {
          $geoWithin: {
            $centerSphere: [pickupLocation, pickupRadius / 3963.2] // Earth's radius in miles
          }
        };
        handleRecentlySearchedLocations(pickupLocation, pickupLocationName);
      }
      if (dropLocation && dropLocation.length === 2) {
        geoWithinQuery['dropLocation.coordinates'] = {
          $geoWithin: {
            $centerSphere: [dropLocation, dropRadius / 3963.2] // Earth's radius in miles
          }
        };
        handleRecentlySearchedLocations(dropLocation, dropLocationName);
      }
      matchQuery['$or'] = [geoWithinQuery];
    }


    if ((!pickupLocation || pickupLocation.length === 0) && (!dropLocation || dropLocation.length === 0)) {
      matchQuery.isCovered = false; // Reset the isCovered filter
    }

    if (date) {
      matchQuery.pickupDate = date;
    }
    if (packageType) {
      // Use the $in operator to match any of the specified packageTypes
      matchQuery.packageType = packageType;
    }
    if (companyNames && companyNames.length > 0) {
      // Use the $in operator to match any of the specified company names
      matchQuery.companyName = { $in: companyNames };
    }
    if (minRate !== undefined && maxRate !== undefined) {
      matchQuery.ratePerMile = { $gte: minRate, $lte: maxRate };
    } else if (minRate !== undefined) {
      matchQuery.ratePerMile = { $gte: minRate };
    } else if (maxRate !== undefined) {
      matchQuery.ratePerMile = { $lte: maxRate };
    }
    if (loadRequirement && loadRequirement.length > 0) {
      matchQuery.loadRequirement = { $in: loadRequirement };
    }
    if (loadType) {
      // Use the $in operator to match any of the specified packageTypes
      matchQuery.loadType = loadType;
    }
    if (minLoadLength !== undefined && maxLoadLength !== undefined) {
      matchQuery.loadLength = { $gte: minLoadLength, $lte: maxLoadLength };
    } else if (minLoadLength !== undefined) {
      matchQuery.loadLength = { $gte: minLoadLength };
    } else if (maxLoadLength !== undefined) {
      matchQuery.loadLength = { $lte: maxLoadLength };
    }

    if (minLoadDistance !== undefined && maxLoadDistance !== undefined) {
      matchQuery.loadDistance = { $gte: minLoadDistance, $lte: maxLoadDistance };
    } else if (minLoadDistance !== undefined) {
      matchQuery.loadDistance = { $gte: minLoadDistance };
    } else if (maxLoadDistance !== undefined) {
      matchQuery.loadDistance = { $lte: maxLoadDistance };
    }
    // handleRecentlySearchedLocations();

    await user.save();
    const aggregationPipeline = [
      {
        $match: matchQuery
      }
    ];
    if (sortBy && Array.isArray(sortBy) && sortBy.length > 0) {
      const sortCriteria = {};
      sortBy.forEach(field => {
        if (field) {
          const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
          sortCriteria[field] = sortOrderValue;
        }
      });

      if (sortBy.includes('ageOfLoadPost')) {
        sortCriteria['createdAt'] = -1; // Sort by createdAt timestamp in descending order
      }
      aggregationPipeline.push({
        $sort: sortCriteria
      });
    }
    const filteredLoads = await Load.aggregate(aggregationPipeline);
    return filteredLoads;
  } catch (error) {
    throw error;
  }
};

const secondSearchFilterLoadsForCarrier = async (pickupLocation, date) => {
  try {
    const loads = await Load.find({
      pickupDate: {
        $eq: date,
      },
      isCovered: false
    });
    return loads;
  } catch (error) {
    throw error;
  }
};

const toggleSavedFilter = async (filterId, userId) => {
  try {
    // Find the  filter by ID
    const filter = await Filter.findById(filterId);
    if (!filter) {
      throw new Error('Filter not found');
    }
    // Find the user by ID
    const user = await userService.getUserById(userId);
    // Check if the loadId is present in the user's savedLoad array
    const isFilterSaved = user.savedFilter.includes(filterId);
    // Update the isSaved field of the load
    filter.isSaved = !isFilterSaved;
    // Save the updated load
    await filter.save();
    if (isFilterSaved) {
      // Unsave the load
      await User.findByIdAndUpdate(
        userId,
        { $pull: { savedFilter: filterId } },
        { new: true }
      );
    } else {
      // Save the filter
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { savedFilter: filterId } },
        { new: true }
      );
    }
    return filter;
  } catch (error) {
    throw error;
  }
};


const getSavedFiltersForUser = async (userId) => {
  try {
    // Find the user by ID and populate the savedLoad field to get load details
    const user = await User.findById(userId).populate('savedFilter');

    if (!user) {
      throw new Error('User not found');
    }

    // Extract saved loads from the user
    const savedFilters = user.savedFilter;

    // Create an array to store cargo details
    const userSavedFilters = [];

    // Fetch details of saved loads
    for (const userSavedFilter of userSavedFilters) {
      const filter = await Filter.findById(savedFilter._id);
      if (filter) {
        userSavedFilters.push(filter);
      }
    }

    return savedFilters;
  } catch (error) {
    throw error;
  }
};



const saveFilterForCarriers = async (userId, filterData) => {
  try {

    const user = await User.findById(userId);
    if (user.role != 'carrier') {
      throw new Error('Carrier not found');
    }

    // Generate a new ObjectId for the filter entry
    const newFilter = new Filter({
      filteredBy: userId, // Use the user's ObjectId as the reference
      ...filterData,
    });

    // Save the new filter entry
    const savedFilter = await newFilter.save();

    return savedFilter;
  } catch (error) {
    throw error;
  }
};


const getSavedFiltersForCarriers = async (userId) => {
  try {
    const filters = await Filter.find({ filteredBy: userId })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .limit(5);

    return filters;
  } catch (error) {
    throw error;
  }
}


const deleteFiltersForCarriers = async (userId, filterIds) => {
  try {
    // Use the $in operator to find and delete multiple filter entries by their IDs
    const result = await Filter.deleteMany({ filteredBy: userId, _id: { $in: filterIds } });
    return result;
  } catch (error) {
    throw error;
  }
}




/**
 * Get loads sorted by ratePerMile in descending order.
 * @returns {Promise<Array>}
 */
const getLoadsBySorting = async (sortBy) => {
  try {
    const sortCriteria = {};
    sortBy.forEach(field => {
      if (field) {
        // Descending order
        sortCriteria[field] = -1;
      }
    });

    const loads = await Load.find({})
      .sort(sortCriteria)
      .exec();

    return loads;
  } catch (error) {
    throw error;
  }
};

const getRecentLoads = async (user) => {
  try {
    const savedLoads = user.savedLoad.map(loadId => loadId.toString()); // Convert load IDs to strings

    // Fetch all loads sorted by createdAt in descending order (most recent first)
    const recentLoads = await Load.find({})
      .sort({ 'createdAt': -1 })
      .lean(); // Convert Mongoose documents to plain objects

    // Check each load and set isSaved based on user's savedLoad array
    recentLoads.forEach(load => {
      load.isSaved = savedLoads.includes(load._id.toString());
    });

    return recentLoads;
  } catch (error) {
    throw error;
  }
};



const getCompanyNamesByUserId = async (userId) => {
  try {

    const companyNames = await User.distinct('companyName');
    const companyObjects = companyNames.map((name) => ({ name }))
    return companyObjects;
  } catch (error) {
    throw error;
  }
}


/**
 * Delete load by id
 * @param {ObjectId} id
 * @returns {Promise<Load>}
 */

const deleteLoadById = async (loadId) => {
  try {
    const deleteLoad = await Load.findByIdAndDelete(loadId);
    return deleteLoad;

  } catch (error) {
    throw error
  }
};




module.exports = {
  createLoad,
  getLoadsByShipperAndLocation,
  getLoadById,
  updateLoadIsCovered,
  filterLoads,
  toggleSavedLoad,
  getSavedCargosForUser,
  searchFilterLoadsForCarrier,
  secondSearchFilterLoadsForCarrier,
  getRecentLoads,
  getCompanyNamesByUserId,
  deleteLoadById,
  getLoadsBySorting,
  saveFilterForCarriers,
  getSavedFiltersForCarriers,
  deleteFiltersForCarriers,
  getLoadByDynamicId,
  createShippingAddress,
  deleteShippingAddresses,
  getUserSchedules,
  editShippingAddress,
  editLoadByIdService,
  getSavedFiltersForUser,
  toggleSavedFilter,
  getLoadsByShipper
}

