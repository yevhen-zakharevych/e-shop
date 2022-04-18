const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const { Category } = require('../models/category');
const { Product } = require('../models/product');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = file.mimetype in FILE_TYPE_MAP;
    let uploadError = null;

    if (!isValid) {
      uploadError = new Error('Invalid image type');
    }

    cb(uploadError, 'public/uploads');
  },
  filename: function (req, file, cb) {
    console.log(file);

    const fileName = file.originalname.split(' ').join('-') + '-' + Date.now();
    const extention = FILE_TYPE_MAP[file.mimetype];

    cb(null, `${fileName}.${extention}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get('/', async (req, res) => {
  const filter = req.query.categories
    ? { category: req.query.categories.split(',') }
    : {};

  const productList = await Product.find(filter); // .select('name -_id');

  if (!productList) {
    res.status(500).json({ success: false });
  }

  res.send(productList);
});

router.get('/get/count', async (req, res) => {
  try {
    Product.countDocuments({}, (error, count) => {
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

router.get('/:id', async (req, res) => {
  Product.findById(req.params.id)
    .populate('category')
    .then((product) => {
      if (product) {
        return res.status(200).send(product);
      } else {
        return res.status(404).json({
          succes: false,
          message: `The Product not found`,
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

router.post('/', uploadOptions.single('image'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res
      .status(400)
      .send('The product cannot be created, image is not exist.');
  }

  const fileName = req.file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

  try {
    const category = await Category.findById(req.body.category);

    if (!category) {
      return res
        .status(400)
        .send('The product cannot be created, category does not exist.');
    }
  } catch (error) {
    res.status(500).send({ success: false, error });
  }

  const product = new Product({
    ...req.body,
    image: `${basePath}${fileName}`,
  });

  product
    .save()
    .then((createdProduct) => {
      if (!createdProduct) {
        return res.status(500).send('The product cannot be created.');
      }

      res.status(201).json(createdProduct);
    })
    .catch((error) => {
      res.status(500).json({
        error,
        success: false,
      });
    });
});

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.body.category);

    if (!category) {
      return res
        .status(400)
        .send('The product cannot be created, category does not exist.');
    }
  } catch (error) {
    res.status(500).send({ success: false, error });
  }

  let product = { ...req.body };

  const file = req.file;

  if (file) {
    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    product.image = `${basePath}${fileName}`;
  }

  Product.findByIdAndUpdate(req.params.id, product, { new: true })
    .then((updatedProduct) => {
      if (updatedProduct) {
        return res.status(200).send(updatedProduct);
      }

      return res.status(404).send({
        success: false,
        message: 'The product was not found',
      });
    })
    .catch((error) => {
      res.status(500).send({
        success: false,
        error: error,
      });
    });
});

router.put(
  '/gallery-images/:id',
  uploadOptions.array('images', 10),
  async (req, res) => {
    const files = req.files;

    if (files.length === 0) {
      return res.status(400).send('Images are not exist.');
    }
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    const imagesPath = files.map((file) => `${basePath}${file.filename}`);

    Product.findByIdAndUpdate(
      req.params.id,
      { images: imagesPath },
      { new: true }
    )
      .then((updatedProduct) => {
        if (updatedProduct) {
          return res.status(200).send(updatedProduct);
        }

        return res.status(404).send({
          success: false,
          message: 'The product was not found',
        });
      })
      .catch((error) => {
        res.status(500).send({
          success: false,
          error: error,
        });
      });
  }
);

router.delete('/:id', (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: 'Product id is not valid.',
    });
  }

  Product.findByIdAndRemove(req.params.id)
    .then((deletedProduct) => {
      if (deletedProduct) {
        return res.status(200).json({
          success: true,
          message: `The Product '${deletedProduct.name}' has been deleted!`,
        });
      } else {
        return res.status(404).json({
          succes: false,
          message: `The Product was not found`,
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

router.get('/get/count', async (req, res) => {
  try {
    Product.countDocuments({}, (error, count) => {
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

router.get('/get/featured/:count', async (req, res) => {
  try {
    const count = req.params.count;
    const products = await Product.find({ isFeatured: true }).limit(count);

    if (!products) {
      res.status(500).json({ success: false });
    }

    res.status(200).send(products);
  } catch (error) {
    res.status(500).json({
      success: false,
      error,
    });
  }
});

module.exports = router;
