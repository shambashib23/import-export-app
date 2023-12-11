const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      // required: true,
      default: ''
    },
    profilePicUrl: {
      type: String,
      required: false,
      default: ""
    },
    companyName: {
      type: String, // Include the companyName field in the schema
    },
    corporateEmail: {
      type: String,
    },
    companyWebsite: {
      type: String, // Include the companyName field in the schema
    },
    mcNumber: {
      type: String,
      default: ""
    },
    dotNumber: {
      type: String
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    stripeCustomerId: {
      type: String
    },
    phoneNumber: {
      type: String,
      // required: true,
      minlength: 10
    },
    role: {
      type: String,
      enum: roles,
      default: '',
    },
    location: {
      type: String
    },
    otp: {
      type: String
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    activeShippingAddress: [{
      companyFullName: {
        type: String,
        required: true,
        trim: true
      },
      address: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      state: {
        type: String,
        required: true,
        trim: true
      },
      zip: {
        type: String,
        required: true,
        trim: true
      }
    }],
    passwordResetOtp: {
      type: String,
      default: null,
    },
    passwordResetTokenUrl: {
      type: String,
      default: ''
    },
    savedLoad: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Load'
      }
    ],
    savedFilter: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Filter'
      }
    ],
    bankAccount: [
      {
        accountNumber: {
          type: String,
        },
        routingNumber: {
          type: String,
        },
      },
    ],
    recentSearchedLocations: [
      {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          default: [],
        },
        locationName: {
          type: String,

        },
      },
    ],
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
      // default: '', // You can set a default value here
    },
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
