const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv/config');

const categoriesRouter = require('./routers/categories');
const ordersRouter = require('./routers/orders');
const productsRouter = require('./routers/products');
const usersRouter = require('./routers/users');

const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

const PORT = 3000;
const api = process.env.API_URL;

app.use(cors());
app.options('*', cors());

// middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);

// routes
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);

mongoose
  .connect(process.env.CONNECTION_STRING_MONGO)
  .then(() => {
    console.log('Database connection is ready...');
  })
  .catch((error) => {
    console.log('Database is not ready: ', error);
  });

app.listen(PORT, () => {
  console.log(api);
  console.log(`server is running http://localhost:${PORT}`);
});
