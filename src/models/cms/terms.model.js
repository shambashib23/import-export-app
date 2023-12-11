const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('../plugins');

const termsSchema = mongoose.Schema({
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
termsSchema.plugin(paginate);

/**
 * @typedef Privacy
 */
const Terms = mongoose.model('Terms', termsSchema);

module.exports = Terms;
