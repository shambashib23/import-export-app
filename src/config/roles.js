const allRoles = {
  shipper: [
    'createLoad',
    'filterLoadIsCovered',
    'getLoadsByShipper',
    'singleLoadByShipper',
    'editShipperProfile',
    'getShipperProfile',
    'getCarrierByMcNumber'
  ],
  carrier: [
    'saveLoad',
    'getSavedLoads',
    'getFilteredLoad',
    'getRecentLoads',
    'getCarrierProfile',
    'editCarrierProfile',
    'getShippersList',
    'sortLoads',
    'savedRecentFilters',
    'deleteRecentFilters',
    'saveFiltersUsers'
  ],
  admin: [
    'getUsers',
    'manageUsers',
    'getAdmin',
    'getAllUsers',
    'createPrivacyPolicy',
    'getUsersByRole',
    'filterUsersByEmail',
    'getUserReviews',
    'getAllLoadsInAdmin',
    'updateMcData',
    'updateCMS',
    'savedLoadsByAdmin',
    'getUserCount',
    'getLoadCount',
    'getLoadDataInAdmin'
  ],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
