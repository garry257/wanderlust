# Wanderlust - Technical Architecture & Analysis (Airbnb Clone)

This document provides a comprehensive overview of the **Wanderlust** EJS web application architecture, file structures, database schemas, and data flow to analyze how the project functions.

---

## 📂 Project Directory Structure

```text
MajorProject/ (Wanderlust)
│
├── package.json                   # Root package manager (dependencies & node version)
├── Dockerfile                     # Containerization instructions
├── .env                           # Local secrets (Atlas URI, Cloudinary API keys, JWT secret)
├── cloud_config.js                # Cloudinary image hosting setups for Multer
├── schema.js                      # Joi schemas for server-side validation (Listings/Reviews)
├── app.js                         # Main Express application bootstrap & route mounting
│
├── controllers/                   # MVC Controllers (business logic)
│   ├── listingController.js       # CRUD logic for rental listings
│   ├── reviewController.js        # Logic for creating/deleting user reviews
│   └── userController.js          # Authentication flow logic using stateless JWT cookies
│
├── models/                        # Mongoose schemas (MongoDB Models)
│   ├── listing.js                 # Listing schema (geometry, reviews ref, owner ref)
│   ├── review.js                  # Review schema (rating, comment, author ref)
│   └── user.js                    # User schema (email + passport-local-mongoose plugins)
│
├── routes/                        # RESTful API Express Routers
│   ├── listing.js                 # Listings router (/listing)
│   ├── review.js                  # Nested reviews router (/listing/:id/reviews)
│   └── users.js                   # Authentication router (/, signup, login, logout)
│
├── utils/                         # Global helper scripts
│   ├── middleware.js              # Authorization & Authentication (JWT cookie verification)
│   ├── wrapasync.js               # Async handler error-catching wrapper
│   └── expresserror.js            # Custom error class for API status codes
│
├── views/                         # EJS UI templates
│   ├── layouts/
│   │   └── boilerplate.ejs        # Mother template with header, footer, & CSS dependencies
│   ├── includes/
│   │   ├── navbar.ejs             # Top navigation bar component (dynamic session user states)
│   │   └── footer.ejs             # Responsive footer component
│   └── listings/                  # Specific UI pages
│       ├── index.ejs              # Display all listing properties
│       ├── show.ejs               # Single property details (includes map & reviews form)
│       ├── new.ejs                # Create property form (file uploads enabled)
│       └── edit.ejs               # Edit property details form
```

---

## 🛢️ Database Schema Analysis

Wanderlust maps relational behaviors (users, listings, reviews) inside MongoDB using three primary schemas:

### 1. User Schema (`models/user.js`)
- **Fields**:
  - `email` (String, required): Stores the user email.
- **Plugins**:
  - **`passport-local-mongoose`**: Automatically handles username injection, password hashing, and cryptographic salting, making it secure out-of-the-box.

### 2. Listing Schema (`models/listing.js`)
- **Fields**:
  - `title` (String, required)
  - `description` (String)
  - `image`: Object containing `url` (Cloudinary URL) and `filename` (Cloudinary public ID).
  - `price` (Number)
  - `location` (String)
  - `country` (String)
  - `geometry`: GeoJSON Point schema storing `type` ("Point") and `coordinates` (`[longitude, latitude]`) used to pinpoint the property on a map.
  - `reviews` (Array of ObjectIDs): References to the `Review` model.
  - `owner` (ObjectID): Reference to the `User` model who created the listing.
- **Middleware Hooks**:
  - **`findOneAndDelete`**: Triggered when a listing is deleted. It automatically sweeps the database and removes all linked reviews in a cascade delete hook.

### 3. Review Schema (`models/review.js`)
- **Fields**:
  - `comment` (String)
  - `rating` (Number, min: 1, max: 5)
  - `createdAt` (Date, default: Date.now)
  - `author` (ObjectID): Reference to the `User` model who left the review.

---

## 🔒 Middlewares & Server Security

Wanderlust implements multiple checkpoints before routing CRUD requests:

1. **Joi Schema Validation (`schema.js`)**:
   Prevents bad data injections (e.g. negative prices, empty titles) on the API level. Joi validates incoming payloads *before* they reach the Mongoose query engine.
2. **Stateless JWT Cookie Authentication**:
   Replaces Passport.js session middleware. Authenticated status is saved in a secure HTTP-Only cookie named `token`. Custom cookie-based flash middleware handles error alerts sessionlessly.
3. **Authorization Checkpoints**:
   - `isLoggedIn`: Verifies the user is logged in by decoding the JWT token from `req.cookies.token`.
   - `isOwner`: Verifies the logged-in user is the creator of the listing before granting Edit/Delete rights.
   - `isReviewAuthor`: Verifies the user is the original creator of a review before granting delete rights.

---

## ☁️ Image Uploads & Cloud Integration

- **Cloudinary Integration (`cloud_config.js`)**:
  Connects to the Cloudinary API to host listing images.
- **Multer + Multer-Storage-Cloudinary**:
  Intercepts standard multi-part form payloads (`multipart/form-data`) on property creation, uploads the raw image to the Cloudinary cloud storage folder, and writes the resulting secure HTTPS image URL to MongoDB.
