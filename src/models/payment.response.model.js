const mongoose = require('mongoose');
const validator = require('validator');


const { toJSON, paginate } = require('./plugins');

const paymentResponseSchema = mongoose.Schema(
  {
    userId: {
      type: String,
    },
    transcationID: String,
    card_id: String,
    card_token: String,
    customer: String,
    charge_id: String,
    card_last4: String,
    card_expiry_month: Number,
    card_expiry_year: Number,
    status: String,
    invoice_id: String,
    hosted_invoice_url: String,  // Add hosted invoice URL
    invoice_pdf: String,

  },
  {
    timestamps: true,
    versionKey: false
  }
);

paymentResponseSchema.plugin(toJSON);
paymentResponseSchema.plugin(paginate);

/**
 * @typedef PaymentResponse
 */
const PaymentResponse = mongoose.model('PaymentResponse', paymentResponseSchema);

module.exports = PaymentResponse;
