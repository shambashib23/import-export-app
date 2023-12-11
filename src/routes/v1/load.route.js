const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const loadController = require('../../controllers/load.controller');
const loadValidation = require('../../validations/load.validation');
const router = express.Router();

module.exports = router;

router.post('/create-load/:userId', auth('createLoad'), validate(loadValidation.createLoad), loadController.createLoad);


router.post('/create-shipping-address/:userId', auth('createLoad'), loadController.createShippingAddressForShipper);
router.delete('/delete-shipping-address/:userId', auth('createLoad'), loadController.deleteShippingAddressesForShipper);
router.get('/get-shipping-address/:userId', auth('createLoad'), loadController.getSchedulesFromShipper);
router.put('/edit-shipping-address/:userId/:addressId', auth('createLoad'), loadController.editShippingAddressForShipper);




router.get('/fetch-payment-requests/:shipperId', auth(), loadController.fetchPaymentRequestsForShipper);
router.post('/save-cards/:userId', auth(), loadController.addCardForShipper);
router.get('/list-saved-cards/:userId', auth(), loadController.listSaveCards);
router.post('/pay-now/:userId', auth(), loadController.initiatePaymentForShipper);



router.post('/get-all-loads/:userId', auth('getLoadsByShipper'), loadController.getAllLoads);
router.get('/loads/:loadId', loadController.getSingularLoad);
router.put('/edit-loads/:loadId', auth('editShipperProfile'),loadController.editLoadById);
router.put('/loads/:loadId', loadController.updateLoadIsCovered);
router.get('/filter-loads-is-covered/:userId', auth('filterLoadIsCovered'), loadController.getLoadsFilteredByIsCovered);
router.put('/edit-profile/:userId', auth('editShipperProfile'), loadController.editProfileData);
router.get('/profile/:userId', auth('getShipperProfile'), loadController.getShipperProfileData);
router.delete('/profile', auth('getShipperProfile'), loadController.deleteShipperProfile);
router.delete('/delete-loads/:loadId', loadController.deleteLoadsForShippersById);



router.post('/search-by-mc-number', auth('getCarrierByMcNumber'), loadController.getUserByMcNumber);




