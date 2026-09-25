const Listing = require('../models/listing');
const Review = require('../models/review');
const ExpressError = require('../utils/expresserror');

module.exports = {
  // Create a new review for a listing
  async createReview(req, res) {
    const { id } = req.params; // listing id
    const reviewData = req.body.review || req.body;
    // Associate author
    reviewData.author = req.user._id;
    const review = new Review(reviewData);
    await review.save();
    // Add reference to listing
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listing');
    }
    listing.reviews.push(review._id);
    await listing.save();
    req.flash('success', 'Review added');
    res.redirect(`/listing/${id}`);
  },

  // Delete a review
  async deleteReview(req, res) {
    const { id, reviewId } = req.params; // listing id and review id
    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Review not found');
      return res.redirect(`/listing/${id}`);
    }
    // Ensure the logged-in user is the author
    if (!review.author.equals(req.user._id)) {
      req.flash('error', 'You do not have permission to delete this review');
      return res.redirect(`/listing/${id}`);
    }
    // Remove review reference from listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Review deleted');
    res.redirect(`/listing/${id}`);
  }
};
