const { listingSchema, reviewSchema } = require('../schema');
const ExpressError = require('./expresserror');
const Listing = require('../models/listing');
const Review = require('../models/review');

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash('error', 'You must be logged in!');
    return res.redirect('/login');
  }
  next();
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
