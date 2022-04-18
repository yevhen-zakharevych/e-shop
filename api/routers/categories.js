const express = require('express');
const router = express.Router();

const { Category } = require('../models/category');

router.get('/', async (req, res) => {
  const categoriesList = await Category.find();

  if (!categoriesList) {
    res.status(500).json({ success: false });
  }

  res.status(200).send(categoriesList);
});

router.get('/:id', (req, res) => {
  Category.findById(req.params.id)
    .then((category) => {
      if (category) {
        return res.status(200).send(category);
      } else {
        return res.status(404).json({
          succes: false,
          message: `The Category not found`,
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

router.post('/', (req, res) => {
  const { name, icon, color, image } = req.body;

  const category = new Category({
    name,
    icon,
    color,
  });

  category
    .save()
    .then((savedCategory) => res.send(savedCategory))
    .catch((error) =>
      res.status(500).json({
        success: false,
        message: error,
      })
    );
});

router.put('/:id', (req, res) => {
  const { name, icon, color } = req.body;

  Category.findByIdAndUpdate(
    req.params.id,
    {
      name,
      icon,
      color,
    },
    { new: true }
  )
    .then((updatedCategory) => {
      if (updatedCategory) {
        return res.status(200).send(updatedCategory);
      }

      return res.status(404).send({
        success: false,
        message: 'The category was not found',
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
  Category.findByIdAndRemove(req.params.id)
    .then((deletedCategory) => {
      if (deletedCategory) {
        return res.status(200).json({
          success: true,
          message: `The Category '${deletedCategory.name}' has been deleted!`,
        });
      } else {
        return res.status(404).json({
          succes: false,
          message: `The Category not found`,
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

module.exports = router;
