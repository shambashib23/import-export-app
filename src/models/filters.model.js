const mongoose = require('mongoose');
const validator = require('validator');

const { toJSON, paginate } = require('./plugins');

const filterSchema = mongoose.Schema(
  {
    filteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model for carrier
    },
    trailerTypes: [String],
    minWeight: Number,
    maxWeight: Number,
    minPrice: Number,
    maxPrice: Number,
    minRate: Number,
    maxRate: Number,
    loadRequirement: [String],
    pickupLocation: [Number],
    pickupLocationName: String,
    pickupRadius: Number,
    dropLocation: [Number],
    dropLocationName: String,
    dropRadius: Number,
    loadType: String,
    sourceLocation: String,
    destinationLocation: String,
    date: Date,
    packageType: String,
    companyNames: [String],
    minLoadLength: Number,
    maxLoadLength: Number,
    minLoadDistance: Number,
    maxLoadDistance: Number,
    minRate: Number,
    maxRate: Number,
    isSaved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// filterSchema.plugin(toJSON);
filterSchema.plugin(paginate);

/**
 * @typedef Filter
 */
const Filter = mongoose.model('Filter', filterSchema);

module.exports = Filter;


