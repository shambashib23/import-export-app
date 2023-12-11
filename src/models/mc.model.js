const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');


const mcSchema = mongoose.Schema(
  {
    mcNumber: {
      type: String,
    },
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    carrierData:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isMcNumberVerified: {
      type: Boolean,
      default: false
    },
    safetyScore: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending', // You can set a default value here
    },
    riskScore: {
      type: String,
      enum: ['Low', 'High'],
      default: 'High', // You can set a default value here
    },
  },
  {
    timestamps: true,
    versionKey: false
  }
);

mcSchema.plugin(toJSON);
mcSchema.plugin(paginate);

/**
 * @typedef Mc
 */
const McChecker = mongoose.model('McChecker', mcSchema);

module.exports = McChecker;
