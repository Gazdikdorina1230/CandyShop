const express = require('express');
const router = express.Router();
const db = require('../firebase');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const admin = require('firebase-admin');

router.post('/', authenticateToken, async (req, res) => {
    const { items, totalPrice } = req.body;
    const userId = req.user.uid;

    if (!items || !Array.isArray(items) || items.length === 0 || !totalPrice) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    try {
        const newOrder = {
            userId,
            items,
            totalPrice,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const orderRef = await db.collection('orders').add(newOrder);
        res.status(201).json({ message: 'Order placed successfully', orderId: orderRef.id });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const orderRef = db.collection('orders').doc(req.params.id);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const orderData = orderDoc.data();

        if (!req.user || (!req.user.role && orderData.userId !== req.user.uid)) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        res.status(200).json({ id: orderDoc.id, ...orderData });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const ordersSnapshot = await db.collection('orders').get();
            const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json(orders);
        } else {
            const ordersSnapshot = await db.collection('orders').where('userId', '==', req.user.uid).get();
            const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json(orders);
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const orderRef = db.collection('orders').doc(req.params.id);
        await orderRef.update({ status });
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
