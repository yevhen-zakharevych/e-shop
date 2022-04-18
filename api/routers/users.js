const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const router = express.Router();

const { User } = require('../models/user');

const secret = process.env.SECRET;

router.get('/', async (req, res) => {
  const userList = await User.find(); // .select('name phone email');

  if (!userList) {
    res.status(500).json({ success: false });
  }

  res.send(userList);
});

router.get('/:id', (req, res) => {
  User.findById(req.params.id)
    .select('-passwordHash')
    .then((user) => {
      if (user) {
        return res.status(200).send(user);
      } else {
        return res.status(404).json({
          succes: false,
          message: `The User not found`,
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

router.post('/register', async (req, res) => {
  const { email } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: `User '${email}' exists.`,
    });
  }

  const passwordHash = bcrypt.hashSync(req.body.password, 10);

  const user = new User({
    ...req.body,
    passwordHash,
  });

  user
    .save()
    .then((savedUser) => res.send(savedUser))
    .catch((error) =>
      res.status(500).json({
        success: false,
        message: error,
      })
    );
});

router.put('/:id', (req, res) => {
  const passwordHash = req.body.password
    ? bcrypt.hashSync(req.body.password, 10)
    : null;

  const updatedUser = {
    ...req.body,
  };

  if (passwordHash) {
    updatedUser.passwordHash = passwordHash;
  }

  User.findByIdAndUpdate(req.params.id, updatedUser, { new: true })
    .then((updatedUser) => {
      if (updatedUser) {
        return res.status(200).send(updatedUser);
      }

      return res.status(404).send({
        success: false,
        message: 'The user was not found',
      });
    })
    .catch((error) => {
      return res.status(500).send({
        success: false,
        error: error,
      });
    });
});

router.delete('/:id', (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: 'User id is not valid.',
    });
  }

  User.findByIdAndRemove(req.params.id)
    .then((deletedUser) => {
      if (deletedUser) {
        return res.status(200).json({
          success: true,
          message: `The User '${deletedUser.name}' has been deleted!`,
        });
      } else {
        return res.status(404).json({
          succes: false,
          message: `The User was not found`,
        });
      }
    })
    .catch((error) => {
      console.log('error', error);

      return res.status(500).json({
        succes: false,
        error: error,
      });
    });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).send({
      success: false,
      error: 'The user is not found.',
    });
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).send({
      success: false,
      error: 'The password is wrong.',
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    secret,
    {
      expiresIn: '1w',
    }
  );

  return res.status(200).send({
    token,
  });
});

router.get('/get/count', async (req, res) => {
  try {
    User.countDocuments({}, (error, count) => {
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

module.exports = router;
