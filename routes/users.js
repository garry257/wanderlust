const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const catchAsync = require('../utils/wrapasync');
const ExpressError = require('../utils/expresserror');
const { isLoggedIn, validateReview } = require('../utils/middleware'); // reuse if needed

// Render signup form
router.get('/signup', (req, res) => {
  res.render('users/signup.ejs');
});

// Handle signup
router.post('/signup', catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;
  const user = new User({ username, email });
  const registeredUser = await User.register(user, password);
  req.login(registeredUser, err => {
    if (err) return next(err);
    req.flash('success', 'Welcome to Wanderlust!');
    res.redirect('/');
  });
}));

// Render login form
router.get('/login', (req, res) => {
  res.render('users/login.ejs');
});

// Handle login
router.post('/login', passport.authenticate('local', {
  failureFlash: true,
  failureRedirect: '/login'
}), (req, res) => {
  const redirectUrl = req.session.redirectUrl || '/';
  delete req.session.redirectUrl;
  req.flash('success', 'Welcome back!');
  res.redirect(redirectUrl);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { console.error(err); }
    req.flash('success', 'Goodbye!');
    res.redirect('/');
  });
});

module.exports = router;
