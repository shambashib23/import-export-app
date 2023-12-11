const Joi = require('joi');

const createPrivacyPolicy = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    content: Joi.string().required()
  })
};


module.exports = {
  createPrivacyPolicy
}