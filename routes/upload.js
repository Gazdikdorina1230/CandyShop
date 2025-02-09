const express = require('express');
const multer = require('multer');
const admin = require('firebase-admin');
const router = express.Router();

// Multer konfigurálása: használjuk a memória-alapú tárolást, így a fájl a req.file.buffer-ben lesz elérhető
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload - Kép feltöltése
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    // A Storage bucket elérése
    const bucket = admin.storage().bucket();
    // Hozz létre egy új fájl referenciát a bucket-ben. Például az 'images' mappába mentjük, és az időbélyeget is hozzáadjuk a névhez.
    const fileName = `images/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    // A fájl feltöltése (streaming)
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
      // (Opcionális) A fájl publikus elérése, ha azt szeretnéd, hogy bárki megtekinthesse
      await file.makePublic();
      // A publikus URL generálása
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      // A válaszban visszaküldjük a képfeltöltés URL-jét
      res.status(200).json({ imageUrl: publicUrl });
    });

    // A fájl tartalmának befejeződése a feltöltéshez
    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ error: 'Server error during upload.' });
  }
});

module.exports = router;
