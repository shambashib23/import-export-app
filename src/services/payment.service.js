const httpStatus = require('http-status');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const { Payment, User } = require('../models');
const { PaymentResponse } = require('../models');
const { Load } = require('../models');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getUserByEmail } = require('./user.service');

const createPaymentRequest = async (carrierId, loadId, id, rate, docUrl) => {
  try {
    const paymentRequest = new Payment({
      loadId,
      id,
      rate,
      docUrl,
      requestedBy: carrierId,
      requestedTo: id
      // requestedTo: load.createdBy[0], // The shipper's user ID
    });

    return paymentRequest.save();

  } catch (error) {
    throw error
  }
};


const fetchPaymentRequests = async (shipperId) => {
  try {
    const paymentRequests = await Payment.find({
      requestedTo: shipperId,
    });
    return paymentRequests;

  } catch (error) {
    throw error
  }
}

const fetchPaymentRequestsForCarrier = async (carrierId) => {
  try {
    const paymentRequests = await Payment.find({
      requestedBy: carrierId,
    });
    return paymentRequests;

  } catch (error) {
    throw error
  }
}

const fetchPaymentRequestById = async (id) => {
  return Payment.findById(id);
}


const createCustomer = async (user) => {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName,
  });

  return customer.id;
};



const createCustomerCard = async ({ email, card }) => {
  const user = await User.findOne({ email: email });
  let customer;
  if (user && user.stripeCustomerId) {
    customer = await stripe.customers.retrieve(user.stripeCustomerId);
  } else {
    customer = await stripe.customers.create({
      email,
    })
    user.stripeCustomerId = customer.id;
    await user.save();
  }
  const { number, exp_month, exp_year, cvc } = card;
  const cardToken = await stripe.tokens.create({
    card: {
      number,
      exp_month,
      exp_year,
      cvc,
    },
  });
  console.log("card token: ----> ", cardToken)
  const createdCard = await stripe.customers.createSource(user.stripeCustomerId, { source: cardToken.id })

  console.log("created card: ", createdCard)


  const cards = await stripe.customers.listSources(
    user.stripeCustomerId,
    { object: 'card' }
  );
  console.log("cards: ", cards)
  return cards.data;

}


const ListPaymentMethods = async (stripeCustomerId) => {
  const cards = await stripe.customers.listSources(
    stripeCustomerId,
    { object: 'card' }
  )
  return cards
};







const processOneTimePayment = async (params) => {
  try {
    const cardDetails = {
      'name': params.name,
      'number': params.card_number,
      'exp_month': params.exp_month,
      'exp_year': params.exp_year,
      'cvc': params.cvv
    };

    // Step 1: Create a token for the card
    const stripeCardResponse = await stripe.tokens.create({ card: cardDetails });

    const cardLast4 = stripeCardResponse.card.last4;
    const expiryMonth = stripeCardResponse.card.exp_month;
    const expiryYear = stripeCardResponse.card.exp_year;
    const stripeToken = stripeCardResponse.id;

    // Step 2: Create a customer with user name and email
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
    });

    // Step 3: Attach the card to the customer
    const source = await stripe.customers.createSource(customer.id, {
      source: stripeToken,
    });

    const paymentAmount = parseFloat(params.rate);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const amount = Math.round(paymentAmount * 100);

    // Step 4: Create an invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customer.id,
      unit_amount: amount, // The amount in cents
      currency: 'usd',
      quantity: 1,
      description: `Payment for ${params.email}, Amount: $${(amount / 100).toFixed(2)}`,
    });

    // Step 5: Create an invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      auto_advance: true,
    });

    // Step 6: Pay the invoice
    const invoicePayment = await stripe.invoices.pay(invoice.id);
    console.log('invoice payment', invoicePayment);
    // Step 7: Retrieve the invoice
    const retrieveInvoice = await stripe.invoices.retrieve(invoice.id);

    // Step 8: Return the payment response
    const paymentResponse = new PaymentResponse({
      transcationID: stripeCardResponse.card.id, // Use the card ID as a reference
      card_id: source.id,
      card_token: stripeToken,
      customer: customer.id,
      charge_id: retrieveInvoice.charge,
      card_last4: cardLast4,
      card_expiry_month: expiryMonth,
      card_expiry_year: expiryYear,
      status: retrieveInvoice.status,
      invoice_id: retrieveInvoice.id,
      hosted_invoice_url: retrieveInvoice.hosted_invoice_url,
      invoice_pdf: retrieveInvoice.invoice_pdf,
    });

    return paymentResponse.save();
  } catch (e) {
    throw e;
  }
};




const shipperPaymentService = async (requestId, user, cardId) => {
  const paymentRequest = await Payment.findById(requestId);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentRequest.rate * 100,
    currency: 'usd',
    customer: user.stripeCustomerId,
    payment_method: cardId,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never'
    },
    application_fee_amount: 20,
    // on_behalf_of: accountId
    transfer_data: {
      // amount: 877,
      destination: 'acct_1O8MDRRZxPAm754n'
    },// You can set a fee for your platform
  },
  );
  const invoiceItem = await stripe.invoiceItems.create({
    customer: user.stripeCustomerId,
    amount: paymentRequest.rate * 100, // Convert amount to cents
    currency: 'usd',
    description: 'Payment for your service', // Customize the description
  });
  const invoice = await stripe.invoices.create({
    customer: user.stripeCustomerId
  });

  // Here, you need to retrieve the invoice URL by fetching the invoice object
  const fetchedInvoice = await stripe.invoices.retrieve(invoice.id);
  console.log('invoice', invoice);
  console.log('invoice link', fetchedInvoice);



  const confirmedPaymentIntent = await stripe.paymentIntents.confirm(
    paymentIntent.id
  );
  paymentRequest.paymentStatus = true;
  paymentRequest.paymentMode = "Paid";
  paymentRequest.invoiceId = invoice.id;
  paymentRequest.invoiceUrl = fetchedInvoice.hosted_invoice_url;
  await paymentRequest.save();

  return confirmedPaymentIntent
  // return { paymentIntent: confirmedPaymentIntent, invoice: fetchedInvoice };

};
const saveBankAccountForCarrier = async (user, accountNumber, routingNumber) => {
  try {
    // Create a bank account object

    if (!user.bankAccounts) {
      // If the user has no saved bank accounts, create a new array
      user.bankAccounts = [];
    }

    // Add the new bank account to the user's profile
    user.bankAccounts.push(accountNumber, routingNumber);


    // Save the updated user
    await user.save();

    // Return the updated user
    return user;
  } catch (error) {
    // Handle any errors
    throw error;
  }
};










module.exports = {
  createPaymentRequest,
  processOneTimePayment,
  fetchPaymentRequests,
  createCustomer,
  createCustomerCard,
  ListPaymentMethods,
  fetchPaymentRequestById,
  shipperPaymentService,
  fetchPaymentRequestsForCarrier,
  saveBankAccountForCarrier
}
