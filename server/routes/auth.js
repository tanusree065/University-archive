const express = require('express');
const { body, validationResult } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, 
      errors: errors.array()
    });
  }
  next();
};


router.post(
  '/register',
  [
    body('name', 'Name is required').notEmpty().trim(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    body('role', 'Invalid role').optional().isIn(['student', 'teacher', 'guest']),
    body('department').optional().trim()
  ],
  validate,
  register
);


router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').notEmpty()
  ],
  validate,
  login
);

module.exports = router;
