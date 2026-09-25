const { listingSchema, reviewSchema } = require('../schema');
const ExpressError = require('./expresserror');
const Listing = require('../models/listing');
const Review = require('../models/review');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysupersecretcode';

// Middleware to check if user is logged in using JWT Cookies
function isLoggedIn(req, res, next) {
  const token = req.cookies?.token;
  
  if (!token) {
    res.cookie('redirectUrl', req.originalUrl, { httpOnly: true, maxAge: 5 * 60 * 1000 });
    req.flash('error', 'You must be logged in!');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie('token');
    res.cookie('redirectUrl', req.originalUrl, { httpOnly: true, maxAge: 5 * 60 * 1000 });
    req.flash('error', 'Session expired. Please log in again!');
    return res.redirect('/login');
  }
}

// Middleware to verify listing owner
async function isOwner(req, res, next) {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing.owner.equals(res.locals.currUser._id)) {
    req.flash('error', 'You are not the owner of this listing!');
    return res.redirect(`/listing/${id}`);
  }
  next();
}

// Middleware to verify review author
async function isReviewAuthor(req, res, next) {
  const { id, reviewId } = req.params;
  const reviewDoc = await Review.findById(reviewId);
  if (!reviewDoc.author.equals(res.locals.currUser._id)) {
    req.flash('error', 'You did not create this review!');
    return res.redirect(`/listing/${id}`);
  }
  next();
}

// Validation middleware for listing
function validateListing(req, res, next) {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    throw new ExpressError(400, msg);
  }
  next();
}

// Validation middleware for review
function validateReview(req, res, next) {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(',');
    throw new ExpressError(400, msg);
  }
  next();
}

module.exports = { isLoggedIn, isOwner, isReviewAuthor, validateListing, validateReview };
