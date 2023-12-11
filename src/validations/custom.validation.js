const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

const newPassword = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};
// const phoneNumber = (value, helpers) => {
//   if (value.length <= 10) {
//     return helpers.message('Phone Number must be at least 10 characters');
//   }
//   if (!value.match(/^[0-9]{10}$/)) {
//     return helpers.message('Enter a valid phone number!');
//   }
// }

module.exports = {
  objectId,
  password,
  newPassword
  // phoneNumber
};
