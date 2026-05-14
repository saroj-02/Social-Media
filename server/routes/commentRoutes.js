const express = require('express');
const { addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, addComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
