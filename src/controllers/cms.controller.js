const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { cmsService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');
const { responseMessage } = require('../utils/common');

const createPrivacyPolicy = catchAsync(async (req, res) => {
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to edit privacy policy');
  }
  const privacyPolicy = await cmsService.createPrivacyPolicy(req.body);
  new ApiResponse(res, httpStatus.OK, responseMessage.CREATE_CMS_SUCCESS, privacyPolicy);
});



const createTerms = catchAsync(async (req, res) => {
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to edit privacy policy');
  }
  const terms = await cmsService.createTerms(req.body);
  new ApiResponse(res, httpStatus.OK, 'Terms created successfully!', terms);
});

const getTermsById = catchAsync(async (req, res) => {
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get Terms data');
  }
  const terms = await cmsService.getTermsById(req.params.termsId);
  new ApiResponse(res, httpStatus.OK, 'Terms fetched successfully!', terms);
})

const editTermsForAdmin = catchAsync(async (req, res) => {
  const { termsId } = req.params;
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to edit privacy policy');
  }
  const updatedTerms = req.body;
  const updatedTermsData = await cmsService.editTermsData(termsId, updatedTerms);
  new ApiResponse(res, httpStatus.OK, responseMessage.CMS_DATA_UPDATION, updatedTermsData);
})


const getTermsForAll = catchAsync(async (req, res) => {
  const getTerms = await cmsService.getTerms();
  new ApiResponse(res, httpStatus.OK, 'Terms fetched successfully!', getTerms);
})




const getPrivacyById = catchAsync(async (req, res) => {
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to get Terms data');
  }
  const terms = await cmsService.getPrivacyById(req.params.privacyId);
  new ApiResponse(res, httpStatus.OK, 'Privacy fetched successfully!', terms);
})

const editPrivacyPolicyForAdmin = catchAsync(async (req, res) => {
  const { privacyId } = req.params;
  const admin = req.user;
  if (admin.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins are allowed to edit privacy policy');
  }
  const updatedPrivacyPolicy = req.body;
  const updatedPrivacyPolicyData = await cmsService.editPrivacyData(privacyId, updatedPrivacyPolicy);
  new ApiResponse(res, httpStatus.OK, responseMessage.CMS_DATA_UPDATION, updatedPrivacyPolicyData);
})


const getPrivacyPolicyForAll = catchAsync(async (req, res) => {
  const getPrivacyPolicy = await cmsService.getPrivacyPolicy();
  new ApiResponse(res, httpStatus.OK, responseMessage.GET_CMS_SUCCESS, getPrivacyPolicy);
})



module.exports = {
  createPrivacyPolicy,
  getPrivacyPolicyForAll,
  editPrivacyPolicyForAdmin,
  createTerms,
  getTermsForAll,
  getTermsById,
  editTermsForAdmin,
  getPrivacyById
}
