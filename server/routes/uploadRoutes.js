const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Max limit is 50MB.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileUrl;
    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL — already absolute HTTPS
      fileUrl = req.file.path.replace(/^http:\/\//, 'https://');
    } else {
      // Local disk — construct absolute URL using HTTPS in production
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : (req.protocol || 'http');
      fileUrl = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    res.json({ url: fileUrl });
  });
});

module.exports = router;
