const express = require('express');
const router = express.Router({ mergeParams: true }); // to access :id from parent listing
const wrapAsync = require('../utils/wrapasync');
const { isLoggedIn, isReviewAuthor, validateReview } = require('../utils/middleware');
const reviewController = require('../controllers/reviewController');

// Create Review
router.post('/:id/reviews', isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Delete Review
router.delete('/:id/reviews/:reviewId', isLoggedIn, isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
