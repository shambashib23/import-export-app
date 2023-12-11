const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Load } = require('../models');
const geolib = require('geolib');
const mongoose = require('mongoose');

const getDistanceByCoordinates =  async (loadBody) => {
  const pickupLocation = {
    latitude: loadBody.pickupLocation.coordinates[1],
    longitude: loadBody.pickupLocation.coordinates[0],
  };

  const dropLocation = {
    latitude: loadBody.dropLocation.coordinates[1],
    longitude: loadBody.dropLocation.coordinates[0],
  };

  const distance = geolib.getDistance(pickupLocation, dropLocation);
  const distanceInMiles = distance * 0.000621371;

  return distanceInMiles;
}

module.exports = {
  getDistanceByCoordinates
}



