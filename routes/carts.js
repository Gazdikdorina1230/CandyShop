const express = require('express');
const router = express.Router();
const db = require('../firebase');
const admin = require('firebase-admin');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.uid;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  try {
    const cartRef = db.collection('carts').doc(userId);
    const cartSnapshot = await cartRef.get();

    if (cartSnapshot.exists) {
      const cartData = cartSnapshot.data();
      let updatedItems = [...cartData.items];

      const itemIndex = updatedItems.findIndex(item => item.productId === productId);
      if (itemIndex !== -1) {
        updatedItems[itemIndex].quantity += quantity;
      } else {
        updatedItems.push({ productId, quantity });
      }

      await cartRef.update({
        items: updatedItems,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).json({ message: 'Item added/updated in cart' });
    } else {
      await cartRef.set({
        userId,
        items: [{ productId, quantity }],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(201).json({ message: 'Cart created and item added' });
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const cartSnapshot = await db.collection('carts').doc(userId).get();
    if (!cartSnapshot.exists) {
      return res.status(200).json({ items: [] });
    }
    return res.status(200).json(cartSnapshot.data());
  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:productId', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const { productId } = req.params;

  try {
    const cartRef = db.collection('carts').doc(userId);
    const cartSnapshot = await cartRef.get();

    if (!cartSnapshot.exists) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    let updatedItems = cartSnapshot.data().items.filter(item => item.productId !== productId);

    await cartRef.update({
      items: updatedItems,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/', authenticateToken, async (req, res) => {
  const userId = req.user.uid;

  try {
    const cartRef = db.collection('carts').doc(userId);
    await cartRef.delete();
    return res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
