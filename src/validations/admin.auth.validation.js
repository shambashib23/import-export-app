const Joi = require('joi');
const { password, newPassword, objectId } = require('./custom.validation');


const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
  }),
};

const getAdmin = {
  params: Joi.object().keys({
    adminId: Joi.string().custom(objectId),
  }),
}


module.exports = {
  register,
  getAdmin
}
