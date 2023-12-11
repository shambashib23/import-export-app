const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const adminController = require('../../controllers/admin.controller');
const cmsController = require('../../controllers/cms.controller');
const router = express.Router();
const cmsValidation = require('../../validations/cms.validation');
const adminValidation = require('../../validations/admin.auth.validation');
module.exports = router;

router.get('/get-user/:userId', auth('getUsers'), adminController.getUserById);
router.get('/get-all-users', auth('getAllUsers'), adminController.getAllUsers);


router.post('/register-admin', adminController.registerAdmin);
router.get('/admin-profile', auth('getAdmin'), adminController.getAdminInfo);
router.put('/:adminId', adminController.editProfileDataForAdmin);
router.put('/edit-privacy-policy/:privacyId', auth('updateCMS'), cmsController.editPrivacyPolicyForAdmin);
router.put('/edit-terms/:termsId', auth('updateCMS'), cmsController.editTermsForAdmin);
router.post('/login', adminController.login);


router.post('/cms/create-privacy-policy', auth('createPrivacyPolicy'), cmsController.createPrivacyPolicy);
router.post('/cms/create-terms-conditions', auth('createPrivacyPolicy'), cmsController.createTerms);

router.get('/cms/get-privacy-policy', auth('createPrivacyPolicy'), cmsController.getPrivacyPolicyForAll);
router.get('/cms/get-privacy-policy/:privacyId', auth('createPrivacyPolicy'), cmsController.getPrivacyById);
router.get('/cms/get-terms-conditions', auth('createPrivacyPolicy'), cmsController.getTermsForAll);
router.get('/cms/get-terms-conditions/:termsId', auth('createPrivacyPolicy'), cmsController.getTermsById);
router.get('/filter-users-by-role', auth('getUsersByRole'), adminController.filterUsersByRoleInAdmin);
router.get('/filter-users-by-email', auth('filterUsersByEmail'), adminController.filterUsersByMailInAdmin);
router.get('/get-reviews', auth('getUserReviews'), adminController.getReviewsController);
router.get('/get-all-loads', auth('getAllLoadsInAdmin'), adminController.getAllLoadsForAdmin);
router.post('/get-saved-loads', auth('savedLoadsByAdmin'), adminController.savedLoadsByCarrier);
router.post('/get-shipper-loads', auth('savedLoadsByAdmin'), adminController.getAllLoadsByShipper);
router.get('/get-user-count', auth('getUserCount'), adminController.getNummberOfUsers);
router.get('/get-load-count', auth('getLoadCount'), adminController.getNummberOfLoads);
router.get('/get-load-data/:loadId', auth('getLoadDataInAdmin'), adminController.getLoadByIdAdmin);

// router.get('/get-mc-numbers/:adminId', adminController.fetchMcNumbers);
// router.post('/verify-mc-number/:adminId', adminController.checkAndSetSafetyAndRisk);
router.post('/verify-mc-number/:userId', auth('updateMcData'), adminController.updateMcChecker);
router.post('/search-mc-number', adminController.searchUserByMcNumber);
router.post('/get-all-transactions', adminController.getAllTransactions);
