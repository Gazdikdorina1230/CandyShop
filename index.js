const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000; 

const db = require('./firebase');

app.use(cors()); 
app.use(express.json()); 
app.use(morgan('dev'));

const uploadRouter = require('./routes/upload');
const cartsRouter = require('./routes/carts');
const usersRouter = require('./routes/users');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

app.use('/api/upload', uploadRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
