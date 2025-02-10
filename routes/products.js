const express = require('express');
const router = express.Router();
const db = require('../firebase');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const admin = require('firebase-admin');

const storage = admin.storage();
const bucket = storage.bucket(); 

router.get('/', async (req, res) => {
    try {
        const productsSnapshot = await db.collection('products').get();
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, imageUrl } = req.body;

        if (!name || !description || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newProduct = {
            name,
            description,
            price,
            imageUrl: imageUrl || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const productRef = await db.collection('products').add(newProduct);
        res.status(201).json({ id: productRef.id, ...newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, imageUrl } = req.body;

        if (!name && !description && !price && !imageUrl) {
            return res.status(400).json({ error: 'At least one field must be provided' });
        }

        const productRef = db.collection('products').doc(req.params.id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await productRef.update(req.body);
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const productRef = db.collection('products').doc(req.params.id);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await productRef.delete();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/upload', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const imageFile = req.files.image;
        const fileName = `products/${Date.now()}_${imageFile.name}`;
        const file = bucket.file(fileName);

        await file.save(imageFile.data, {
            metadata: { contentType: imageFile.mimetype },
        });

        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
