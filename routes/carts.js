const express = require('express');
const router = express.Router();
const db = require('../firebase');
const admin = require('firebase-admin');

// Kosárba új termék hozzáadása (POST)
router.post('/', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).send('Missing required fields');
  }

  try {
    const cartRef = db.collection('carts').doc(userId);
    const cartSnapshot = await cartRef.get();

    if (cartSnapshot.exists) {
      // Ha létezik a kosár, hozzáadjuk az új elemet
      const cartData = cartSnapshot.data();
      const updatedItems = [...cartData.items, { productId, quantity }];
      await cartRef.update({ items: updatedItems });
      res.status(200).send('Item added to cart');
    } else {
      // Ha nincs, létrehozzuk az új kosarat
      await cartRef.set({
        userId,
        items: [{ productId, quantity }],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.status(201).send('Cart created and item added');
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Kosár megjelenítése (GET)
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const cartSnapshot = await db.collection('carts').doc(userId).get();
    if (!cartSnapshot.exists) {
      return res.status(404).send('Cart not found');
    }
    const cart = cartSnapshot.data();
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
