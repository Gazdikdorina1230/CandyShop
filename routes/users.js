const express = require('express');
const router = express.Router();
const db = require('../firebase'); // Firebase kapcsolat
const bcrypt = require('bcryptjs'); // Jelszó hash-eléséhez
const jwt = require('jsonwebtoken'); // JWT tokenek kezeléséhez

// Győződjünk meg róla, hogy a .env fájl tartalma betöltődik
require('dotenv').config();

// ---------------------------------------------
// Felhasználó regisztrációja
// POST /api/users/register
// ---------------------------------------------
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  // Alap ellenőrzés: email és jelszó kötelező
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Ellenőrizzük, hogy már létezik-e a felhasználó az adott email címmel
    const usersRef = db.collection('users');
    const existingUserSnapshot = await usersRef.where('email', '==', email).get();
    if (!existingUserSnapshot.empty) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    // Hash-eljük a jelszót
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Felhasználó adatainak összeállítása
    const newUser = {
      email,
      passwordHash,
      role: role || 'customer',  // Alapértelmezett szerep: customer
      createdAt: new Date().toISOString()
    };

    // Új dokumentum hozzáadása a 'users' kollekcióhoz
    const docRef = await usersRef.add(newUser);

    res.status(201).json({ id: docRef.id, message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ---------------------------------------------
// Felhasználó bejelentkezése
// POST /api/users/login
// ---------------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Ellenőrzés: email és jelszó kötelező
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Keressük meg a felhasználót az email alapján
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // A feltételezett egyetlen dokumentum
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Ellenőrizzük a jelszót a tárolt hash-el
    const isMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // JWT token létrehozása a felhasználó adataival
    const payload = {
      userId: userDoc.id,
      email: userData.email,
      role: userData.role
    };

    // A token a .env fájlban beállított JWT_SECRET értékkel kerül aláírásra
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token, message: 'Logged in successfully.' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
