const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('../plugins');

const privacySchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  }
},
  {
    timestamps: true,
    versionKey: false
  }
);

// privacySchema.plugin(toJSON);
privacySchema.plugin(paginate);

/**
 * @typedef Privacy
 */
const Privacy = mongoose.model('Privacy', privacySchema);

module.exports = Privacy;
