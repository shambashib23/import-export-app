const mongoose = require('mongoose');
const validator = require('validator');

const { toJSON, paginate } = require('./plugins');

const loadSchema = mongoose.Schema(
  {
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [],
      },
      pickupLocationName: {
        type: String,
        required: true,
      },
    },
    loadId: {
      type: String,
    },
    dropLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [],
      },
      dropLocationName: {
        type: String,
        required: true,
      },
    },
    loadDistance: {
      type: Number,
    },
    phoneNumber: {
      type: String,
      required: true
    },
    packageType: {
      type: String,
      required: true,
      trim: true
    },
    companyName: {
      type: String,
      required: true
    },
    corporateEmail: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    ratePerMile: {
      type: Number,
      required: true
    },
    pickupDate: {
      type: String,
      required: true
    },
    dropDate: {
      type: String,
      required: true
    },
    loadLength: {
      type: Number,
      required: true
    },
    trailerType: [
      String
    ],
    loadRequirement: [
      String
    ],
    loadType: {
      type: String,
      required: true
    },
    activeShipmentStops: [{
      pickupLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          default: [],
        },
        pickupLocationName: {
          type: String,
        },
      },
      notes: {
        type: String
      }
    }],
    loadDocumentUrl: {
      type: String,
    },
    isCovered: {
      type: Boolean,
      default: false
    },
    isSaved: {
      type: Boolean,
      enum: [true, false],
      default: false
    },
    isPaid: {
      type: Boolean,
      enum: [true, false],
      default: false
    },
    createdBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// loadSchema.plugin(toJSON);
loadSchema.plugin(paginate);
loadSchema.index({ pickupLocation: '2dsphere', dropLocation: '2dsphere' });

/**
 * @typedef Load
 */
const Load = mongoose.model('Load', loadSchema);

module.exports = Load;


