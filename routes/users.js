const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const catchAsync = require('../utils/wrapasync');

router.get('/signup', userController.renderSignupForm);

router.post('/signup', catchAsync(userController.signup));

router.get('/login', userController.renderLoginForm);

router.post('/login', catchAsync(userController.login));

router.get('/logout', userController.logout);

module.exports = router;
