if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
const app = express();
const listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const wrapAsync = require("./utils/wrapasync.js");
const ExpressError = require("./utils/expresserror.js");
const {listingSchema, reviewSchema}= require("./schema.js");
const review = require("./models/review.js");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mysupersecretcode";
const User = require("./models/user.js");
const listingController = require('./controllers/listingController');

  
const MONGO_URL = process.env.ATLAS_URI;
if (!MONGO_URL) {
  throw new Error("ATLAS_URI must be set in .env to connect to Atlas");
}

// Setup basic Express middleware BEFORE connecting to DB
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieParser());
app.engine("ejs", ejsmate);
app.use(express.static(path.join(__dirname, "/public")));

// Ensure templates always have a defined `currUser` variable to avoid
// ReferenceError in EJS when checking `if (!currUser)`.
app.locals.currUser = null;
// Default flash/message locals so includes can safely check them even when
// no flash messages have been set yet.
app.locals.success = [];
app.locals.error = [];
app.locals.redirectUrl = null;

async function main() {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  console.log("Using DNS servers:", dns.getServers());
  console.log("Connecting to Atlas...");
  try {
    await mongoose.connect(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    console.log("connected to DB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }

  // Custom Session-less Cookie-based Flash Middleware
  app.use((req, res, next) => {
    let flashData = {};
    if (req.cookies?.flash) {
      try {
        flashData = JSON.parse(req.cookies.flash);
      } catch (err) {
        flashData = {};
      }
    }
    
    // Clear flash cookie right away
    res.clearCookie('flash');

    req.flash = (type, message) => {
      if (message) {
        const currentFlash = req.cookies?.flash ? JSON.parse(req.cookies.flash) : {};
        if (!currentFlash[type]) currentFlash[type] = [];
        currentFlash[type].push(message);
        res.cookie('flash', JSON.stringify(currentFlash), { httpOnly: true, maxAge: 30000 });
        return;
      } else {
        return flashData[type] || [];
      }
    };
    next();
  });

  app.use((req, res, next) => {
     res.locals.success = req.flash("success");
     res.locals.error = req.flash("error");
     
     // Populate currUser from JWT token globally
     const token = req.cookies?.token;
     if (token) {
       try {
         const decoded = jwt.verify(token, JWT_SECRET);
         res.locals.currUser = decoded;
         req.user = decoded;
       } catch (err) {
         res.clearCookie('token');
         res.locals.currUser = null;
       }
     } else {
       res.locals.currUser = null;
     }

     if (req.cookies?.redirectUrl) {
        res.locals.redirectUrl = req.cookies.redirectUrl;
     } else {
        res.locals.redirectUrl = null;
     }
     next();
  });

  // Setup routes AFTER session, flash, and passport
  const listingRoutes = require('./routes/listing');
  const reviewRoutes = require('./routes/review');
  const userRoutes = require('./routes/users');

  app.use('/listing', listingRoutes);
  app.use('/listing', reviewRoutes); // review routes nested under /listing
  app.use('/', userRoutes); // signup, login, logout routes

  app.get("/", wrapAsync(listingController.index));

  app.use((req, res, next) => {
      next(new ExpressError(404, "Page Not Found!"));
  });

  app.use((err, req, res, next) => {
      let { statuscode = 500, message = "Something went wrong!" } = err;
      res.status(statuscode).render("error.ejs", { message });
  });
}


main()
  .then(() => {
    app.listen(8080, () => {
      console.log("app is listening on server 8080");
    });
  })
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });