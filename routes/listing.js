const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapasync');
const { isLoggedIn, isOwner, validateListing } = require('../utils/middleware');
const listingController = require('../controllers/listingController');
const multer = require('multer');
const { storage } = require('../cloud_config');
const upload = multer({ storage }); 

// Index
router.get('/', wrapAsync(listingController.index));

// New form (MUST come before /:id route)
router.get('/new', isLoggedIn, listingController.renderNewForm);

// Create listing with image upload
router.post('/', isLoggedIn, upload.single('image'), validateListing, wrapAsync(listingController.createListing));

// Edit form (MUST come before /:id route)
router.get('/:id/edit', isLoggedIn, isOwner, listingController.renderEditForm);

// Show listing (matches any /:id - MUST be last)
router.get('/:id', wrapAsync(listingController.showListing));

// Update listing
router.put('/:id', isLoggedIn, isOwner, upload.single('image'), validateListing, wrapAsync(listingController.updateListing));

// Delete listing
router.delete('/:id', isLoggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;
