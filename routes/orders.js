const express = require('express');
const router = express.Router();
const db = require('../firebase');
const admin = require('firebase-admin');
const authenticateToken = require('../middleware/auth');

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const orderRef = db.collection('orders').doc(req.params.id);
        const orderDoc = await orderRef.get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const orderData = orderDoc.data();
        
        if (req.user.role !== 'admin' && orderData.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied: Admins only' });
        }
        
        await orderRef.update(req.body);
        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/', async (req, res) => {
  try {
    const ordersSnapshot = await db.collection('orders').get();
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json({ id: orderDoc.id, ...orderDoc.data() });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newOrder = req.body;
    
    newOrder.createdAt = admin.firestore.FieldValue.serverTimestamp();
    newOrder.status = newOrder.status || 'pending';
    
    const orderRef = await db.collection('orders').add(newOrder);
    res.status(201).json({ id: orderRef.id, ...newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const orderRef = db.collection('orders').doc(req.params.id);
    await orderRef.delete();
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
