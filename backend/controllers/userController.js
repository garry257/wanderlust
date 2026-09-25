const User = require('../models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysupersecretcode';

module.exports.renderSignupForm = (req, res) => {
  res.render('users/signup.ejs');
};

module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    
    // Generate JWT token
    const token = jwt.sign(
      { _id: registeredUser._id, username: registeredUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    req.flash('success', 'Welcome to Wanderlust!');
    res.redirect('/');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/signup');
  }
};

module.exports.renderLoginForm = (req, res) => {
  res.render('users/login.ejs');
};

module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Authenticate using passport-local-mongoose built-in static method
    const { user, error } = await User.authenticate()(username, password);

    if (error || !user) {
      req.flash('error', error ? error.message : 'Invalid username or password');
      return res.redirect('/login');
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Check if redirectUrl cookie exists
    const redirectUrl = req.cookies?.redirectUrl || '/';
    res.clearCookie('redirectUrl');

    req.flash('success', 'Welcome back!');
    res.redirect(redirectUrl);
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/login');
  }
};

module.exports.logout = (req, res) => {
  res.clearCookie('token');
  req.flash('success', 'Goodbye!');
  res.redirect('/');
};
