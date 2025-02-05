const express = require('express');
const app = express();
const port = 3000;
const db = require('./firebase');
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// JSON válaszokat kérünk
app.use(express.json());

// Lekérjük az összes terméket a 'products' kollekcióból
app.get('/api/products', async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(products);  // Válasz JSON formátumban
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Kosár kezelése
const cartsRouter = require('./routes/carts');
app.use('/api/carts', cartsRouter);

// Indítjuk az alkalmazást
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
