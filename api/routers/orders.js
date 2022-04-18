const express = require('express');
const router = express.Router();

const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');

router.get('/', async (req, res) => {
  const orderList = await Order.find()
    .populate('user', 'name')
    .populate('orderItems')
    .sort({ dateOrdered: -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }

  res.send(orderList);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({
      path: 'orderItems',
      populate: {
        path: 'product',
        populate: 'category',
      },
    });

  if (!order) {
    res.status(500).json({ success: false });
  }

  res.send(order);
});

router.post('/', async (req, res) => {
  const orderItems = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      const newOrderItem = new OrderItem({ ...orderItem });
      const savedOrderItem = await newOrderItem.save();

      return savedOrderItem._id;
    })
  );

  const orderItemsIdsResolved = await orderItems;

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        'product',
        'price'
      );

      const orderItemTotalPrice = orderItem.quantity * orderItem.product.price;

      return orderItemTotalPrice;
    })
  );

  const totalPrice = totalPrices.reduce((acc, curr) => acc + curr);

  const {
    shippingAddress1,
    shippingAddress2,
    city,
    zip,
    country,
    phone,
    status,
    user,
  } = req.body;

  const order = new Order({
    shippingAddress1,
    shippingAddress2,
    city,
    zip,
    country,
    phone,
    status,
    user,
    totalPrice,
    orderItems: orderItemsIdsResolved,
  });

  order
    .save()
    .then((savedOrder) => res.send(savedOrder))
    .catch((error) =>
      res.status(500).json({
        success: false,
        message: error,
      })
    );
});

router.put('/:id', (req, res) => {
  const { status } = req.body;

  Order.findByIdAndUpdate(
    req.params.id,
    {
      status,
    },
    { new: true }
  )
    .then((updatedOrder) => {
      if (updatedOrder) {
        return res.status(200).send(updatedOrder);
      }

      return res.status(404).send({
        success: false,
        message: 'The Order was not found',
      });
    })
    .catch((error) => {
      res.status(500).send({
        success: false,
        error: error,
      });
    });
});

router.delete('/:id', (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (deletedOrder) => {
      if (deletedOrder) {
        console.log(deletedOrder);

        await deletedOrder.orderItems.map(async (orderItem) => {
          console.log(orderItem);

          await OrderItem.findByIdAndRemove(orderItem);
        });

        return res.status(200).json({
          success: true,
          message: `The Order has been deleted!`,
        });
      } else {
        return res.status(404).json({
          succes: false,
          message: `The order not found`,
        });
      }
    })
    .catch((error) => {
      return res.status(500).json({
        succes: false,
        error: error,
      });
    });
});

router.get('/get/totalsales', async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } },
  ]);

  if (!totalSales) {
    return res.stau(400).json({
      success: false,
      erorr: 'Total sales cannot be generated.',
    });
  }

  return res.json({ totalSales: totalSales[0].totalSales });
});

router.get('/get/count', async (req, res) => {
  try {
    Order.countDocuments({}, (error, count) => {
      if (!count) {
        res.status(500).json({ success: false });
      }

      res.status(200).json({
        count,
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error,
    });
  }
});

router.get('/get/userorders/:userid', async (req, res) => {
  const userOrderList = await Order.find({
    user: req.params.userid,
  })
    .populate({
      path: 'orderItems',
      populate: {
        path: 'product',
        populate: 'category',
      },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) {
    res.status(500).json({ success: false });
  }

  res.send(userOrderList);
});

module.exports = router;
