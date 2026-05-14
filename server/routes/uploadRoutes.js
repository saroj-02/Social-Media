const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Max limit is 50MB.' });
      }
      return res.status(400).json({ message: `Multer error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading.
      return res.status(400).json({ message: err.message });
    }

    // Everything went fine.
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the full URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

module.exports = router;
