const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');
const { Privacy } = require('../models');
const { Terms } = require('../models');


/**
 * Create Privacy Policy
 * @body
 * @returns {Promise<Privacy>}
 */

const createPrivacyPolicy = async (privacyBody) => {
  const cms = await Privacy.create(privacyBody);
  return cms;
}

const getPrivacyById = async (privacyId) => {
  const data = await Privacy.findById(privacyId);
  await data.save();
  return data;
}
const editPrivacyData = async (privacyId, updatedPrivacyPolicy) => {
  const data = await Privacy.findByIdAndUpdate(privacyId, updatedPrivacyPolicy, { new: true });
  await data.save();
  return data;
};



const getPrivacyPolicy = async () => {
  const getCms = await Privacy.find({});
  return getCms
}


/**
 * Create Terms
 * @body
 * @returns {Promise<Privacy>}
 */

const createTerms = async (termsBody) => {
  const cms = await Terms.create(termsBody);
  return cms;
}

const getTermsById = async (termsId) => {
  const data = await Terms.findById(termsId);
  await data.save();
  return data;
}

const getTerms = async () => {
  const getCms = await Terms.find({});
  return getCms
}

const editTermsData = async (termsId, updatedTerms) => {
  const data = await Terms.findByIdAndUpdate(termsId, updatedTerms, { new: true });
  await data.save();
  return data;
};







module.exports = {
  createPrivacyPolicy,
  getPrivacyPolicy,
  editPrivacyData,
  createTerms,
  editTermsData,
  getTerms,
  getTermsById,
  getPrivacyById
}
