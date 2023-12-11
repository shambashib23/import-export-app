const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const loadController = require('../../controllers/load.controller');
const loadValidation = require('../../validations/load.validation');
const router = express.Router();

router.post('/loads/:loadId', auth('saveLoad'), loadController.saveLoadForCarrier);
router.get('/loads/saved-loads/:userId', auth('getSavedLoads'), loadController.getSavedCargos);
router.post('/loads/search-filter/:userId', auth('getFilteredLoad'), loadController.getFilteredLoadsForCarrier);
router.post('/loads/filter/default', auth('getFilteredLoad'), loadController.getFilteredLoadsByPickupLocationAndDate);
router.get('/loads/recent-filter/:userId', auth('savedRecentFilters'), loadController.getRecentFilters);
router.post('/loads/save-recent-filter/:filterId', auth('saveFiltersUsers'), loadController.saveFilterForUser);
router.get('/loads/saved-recent-filters/:userId', auth('saveFiltersUsers'), loadController.getSavedFiltersForCarriers);
router.post('/loads/save-filter/:userId', auth('saveFiltersUsers'), loadController.saveFiltersForCarrier);
router.get('/loads/recent-locations', auth('getFilteredLoad'), loadController.getRecentSearches);



router.post('/payments/create-payment-request/:carrierId', auth(), loadController.createPaymentRequestCarrier);
router.get('/payments/fetch-payment-request/:carrierId', auth(), loadController.fetchPaymentRequestsForCarrier);
router.post('/save-bank-accounts', auth(), loadController.addBankAccountForCarrier);
// router.post('/save-card-carrier/:userId', auth(), loadController.addCardForCarrier);
// router.get('/list-saved-cards/:userId', auth(), loadController.listSaveCards);

router.delete('/loads/delete-recent-filters/:userId', auth('deleteRecentFilters'), loadController.deleteSavedFilters);
router.post('/loads/sort-filter/:userId', auth('sortLoads'), loadController.getSortedLoadsForCarrier);
router.get('/loads/recent-loads/:userId', auth('getRecentLoads'), loadController.getRecentLoadsForCarriers);
router.get('/profile/:userId', auth('getCarrierProfile'), loadController.getShipperProfileData);
router.delete('/profile', auth('getCarrierProfile'), loadController.deleteShipperProfile);
router.put('/profile/:userId', auth('editCarrierProfile'), loadController.editProfileData);
router.get('/get-company-names/:userId', auth('getShippersList'), loadController.getCompanyNamesForCarriers);
module.exports = router;


