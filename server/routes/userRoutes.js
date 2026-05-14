const express = require('express');
const { getUserProfile, followUser, updateProfile, getSuggestions, searchUsers, getAllUsers, getAllUsersAdmin, getUserFullDetails, deleteUser, banUser, unbanUser, acceptTerms } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const router = express.Router();

router.route('/profile/:id').get(getUserProfile);
router.route('/update').put(protect, updateProfile);
router.route('/follow/:id').post(protect, followUser);
router.route('/suggestions').get(protect, getSuggestions);
router.route('/all').get(protect, getAllUsers);
router.route('/search').get(searchUsers);
router.route('/accept-terms').post(protect, acceptTerms);

// Admin Routes
router.route('/admin/users').get(protect, admin, getAllUsersAdmin);
router.route('/admin/users/ban').post(protect, admin, banUser);
router.route('/admin/users/unban/:id').post(protect, admin, unbanUser);
router.route('/admin/users/:id')
  .get(protect, admin, getUserFullDetails)
  .delete(protect, admin, deleteUser);

module.exports = router;
