const mongoose = require('mongoose');
const validator = require('validator');


const { toJSON, paginate } = require('./plugins');


const paymentSchema = mongoose.Schema(
  {
    id: {
      type: String,
    },
    loadId: {
      type: String
    },
    companyName: {
      type: String, // Change to String
    },
    rate: {
      type: Number,
      required: true
    },
    docUrl: {
      type: String,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paymentStatus: {
      type: Boolean,
      default: false
    },
    paymentMode: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
      default: 'Pending', // You can set a default value here
    },
    invoiceId: {
      type: String, // Store the invoice ID
    },
    invoiceUrl: {
      type: String, // Store the invoice URL
    },
  },
  {
    timestamps: true,
    versionKey: false
  }
);

paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

/**
 * @typedef Payment
 */
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
