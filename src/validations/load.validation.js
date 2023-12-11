const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createLoad = Joi.object({
  body: {
    pickupLocation: Joi.object({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).required(),
      pickupLocationName: Joi.string().required().trim(),
    }).required(),
    dropLocation: Joi.object({
      type: Joi.string().valid('Point').required(),
      coordinates: Joi.array().items(Joi.number()).required(),
      dropLocationName: Joi.string().required().trim(),
    }).required(),
    packageType: Joi.string().required().trim(),
    companyName: Joi.string().required().trim(),
    quantity: Joi.number().required(),
    amount: Joi.number().required(),
    loadLength: Joi.number().required(),
    ratePerMile: Joi.number().required(),
    pickupDate: Joi.string().required(),
    dropDate: Joi.string().required(),
    corporateEmail: Joi.string().required,
    loadType: Joi.string().required,
    trailerType: Joi.array().items(Joi.string()),
    loadRequirement: Joi.array().items(Joi.string()),
    activeShipmentStops: Joi.array().items(
      Joi.object({
        pickupLocation: Joi.string().trim(),
        emailAddress: Joi.string().trim(),
        estimatePickupDate: Joi.string().required(),
        notes: Joi.string(),
      })
    ),
    loadDocumentUrl: Joi.string(),
  }
});




const getLoadById = {
  params: Joi.object
}



module.exports = {
  createLoad
}
