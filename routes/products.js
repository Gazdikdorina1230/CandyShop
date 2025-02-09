const express = require('express');
const router = express.Router();
const db = require('../firebase');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    
    try {
        const newProduct = req.body;
        const productRef = await db.collection('products').add(newProduct);
        res.status(201).json({ id: productRef.id, ...newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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

router.get('/:id', async (req, res) => {
    try {
        const productRef = db.collection('products').doc(req.params.id);
        const product = await productRef.get();
        if (!product.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(200).json({ id: product.id, ...product.data() });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const newProduct = req.body;
        const productRef = await db.collection('products').add(newProduct);
        res.status(201).json({ id: productRef.id, ...newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const productRef = db.collection('products').doc(req.params.id);
        await productRef.update(req.body);
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const productRef = db.collection('products').doc(req.params.id);
        await productRef.delete();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
