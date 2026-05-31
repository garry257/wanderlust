const Listing = require('../models/listing');
const geocode = require('../utils/geocode');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  async index(req, res) {
    const { q, minPrice, maxPrice, country, includeTax } = req.query;
    const filters = {
      q: q || '',
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
      country: country || '',
      includeTax: includeTax === 'on' || includeTax === 'true',
    };
    const conditions = [];
    if (filters.q) {
      const regex = new RegExp(escapeRegex(filters.q), 'i');
      conditions.push({
        $or: [
          { title: regex },
          { location: regex },
          { country: regex },
        ],
      });
    }
    if (filters.country) {
      const countryRegex = new RegExp(escapeRegex(filters.country), 'i');
      conditions.push({
        $or: [
          { country: countryRegex },
          { location: countryRegex },
        ],
      });
    }
    const query = conditions.length === 1 ? conditions[0] : conditions.length > 1 ? { $and: conditions } : {};

    const min = Number(filters.minPrice);
    const max = Number(filters.maxPrice);
    if (!Number.isNaN(min) && min > 0) {
      query.price = query.price || {};
      query.price.$gte = min;
    }
    if (!Number.isNaN(max) && max > 0) {
      query.price = query.price || {};
      query.price.$lte = max;
    }
    const allListings = await Listing.find(query);
    res.render('listing/index.ejs', { allListings, filters });
  },

  renderNewForm(req, res) {
    res.render('listing/new.ejs');
  },

  async createListing(req, res) {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    if (req.file) {
      newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }
    // Geocode the location for map
    const locationStr = `${newListing.location}, ${newListing.country}`;
    const coordinates = await geocode(locationStr);
    newListing.geometry = { type: 'Point', coordinates };
    await newListing.save();
    req.flash('success', 'New listing created!');
    res.redirect('/listing');
  },

  async renderEditForm(req, res) {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing not found');
      return res.redirect('/listing');
    }
    res.render('listing/edit.ejs', { listing });
  },

  async updateListing(req, res) {
    const { id } = req.params;
    const updateData = { ...req.body.listing };
    if (req.file) {
      updateData.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }
    // Re-geocode if location or country changed
    const locationStr = `${updateData.location}, ${updateData.country}`;
    const coordinates = await geocode(locationStr);
    updateData.geometry = { type: 'Point', coordinates };
    await Listing.findByIdAndUpdate(id, updateData);
    req.flash('success', 'Listing Updated!');
    res.redirect(`/listing/${id}`);
  },

  async deleteListing(req, res) {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing Deleted!');
    res.redirect('/listing');
  },

  async showListing(req, res) {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: 'reviews', populate: { path: 'author' } })
      .populate('owner');
    if (!listing) {
      req.flash('error', 'Listing you requested for does not exist!');
      return res.redirect('/listing');
    }
    res.render('listing/showw.ejs', { listing });
  }
};
