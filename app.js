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
const session = require("express-session");
const MongoStore = require("connect-mongo").MongoStore;
const flash  = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
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
app.engine("ejs", ejsmate);
app.use(express.static(path.join(__dirname, "/public")));

// Setup routes BEFORE database connection
const listingRoutes = require('./routes/listing');
const reviewRoutes = require('./routes/review');
const userRoutes = require('./routes/users');

app.use('/listing', listingRoutes);
app.use('/listing', reviewRoutes); // review routes nested under /listing
app.use('/', userRoutes); // signup, login, logout routes

app.get("/", wrapAsync(listingController.index));

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

  // Setup MongoStore AFTER database connection
  const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    crypto: {
      secret: "mysupersecretcode",
    },
    touchAfter: 24 * 3600,
  });

  store.on("error", function(e) {
    console.log("session store error", e);
  });

  const sessionoptions = {
    store,
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    }
  };

  app.use(session(sessionoptions));
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use((req,res,next)=>{
     res.locals.success = req.flash("success");
     res.locals.error = req.flash("error");
     res.locals.currUser = req.user || null;
     if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
     }
     next();
  });

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


//  app.get("/testlisting",async(req,res)=>{
//    let samplelisting = new listing({
//     title:"my new villa",
//     description:"by the beach",
//     price:1200,
//     location:"calangute, goa",
//     country:"india",
//    });
//     await samplelisting.save();
//     console.log("sample was saved");
//     res.send("successfull");
//       });


app.get("/", wrapAsync(listingController.index));

app.all("*path", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    let { statuscode = 500, message = "Something went wrong!" } = err;
    res.status(statuscode).render("error.ejs", { message });
});