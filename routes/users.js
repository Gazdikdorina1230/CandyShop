const express = require('express');
const router = express.Router();
const db = require('../firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables.');
}

router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (!validator.isStrongPassword(password, { minLength: 8, minNumbers: 1, minLowercase: 1, minUppercase: 1 })) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one number, one uppercase, and one lowercase letter.' });
  }

  try {
    const usersRef = db.collection('users');
    const existingUserSnapshot = await usersRef.where('email', '==', email).get();
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      email: email.toLowerCase(),
      hashedPassword, 
      role: role || 'customer', 
      createdAt: new Date().toISOString()
    };

    const docRef = await usersRef.add(newUser);
    res.status(201).json({ id: docRef.id, message: 'User registered successfully.' });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials.' }); 
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const payload = {
      userId: userDoc.id,
      email: userData.email,
      role: userData.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, message: 'Logged in successfully.' });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
