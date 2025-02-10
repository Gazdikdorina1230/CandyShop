const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const router = express.Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'));
    }
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const bucket = admin.storage().bucket();
    const fileName = `images/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    const blobStream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload error' });
    });

    blobStream.on('finish', async () => {
      await file.makePublic();
      
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

      res.status(200).json({
        publicUrl: publicUrl 
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ error: 'Server error during upload.' });
  }
});

module.exports = router;
