const express = require('express');
const { createPost, getPosts, likePost, deletePost, searchPosts, getRecommendedReels, updatePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/search', searchPosts);
router.get('/reels/recommended', protect, getRecommendedReels);

router.route('/')
  .post(protect, createPost)
  .get(getPosts);

router.route('/:id')
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:id/like', protect, likePost);

module.exports = router;
