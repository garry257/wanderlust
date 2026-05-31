const mongoose = require("mongoose")
const schema= mongoose.Schema;
const Review = require("./review.js");

const listingschema=new schema({
    title:{
        type:String,
        required:true
    },
    description:String,
    image: {
        url:String,
        filename:String
    },
    price: Number,
    location: String,
    country: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],  // [longitude, latitude]
            default: [0, 0]
        }
    },
    reviews: [
        {
            type: schema.Types.ObjectId,
            ref: "Review",
        }
    ],
    owner: {
        type: schema.Types.ObjectId,
        ref: "User",
    }
});

listingschema.post("findOneAndDelete", async function(listing) {
    if (listing) {
        await Review.deleteMany({
            _id: {
                $in: listing.reviews,
            },
        });
    }
});

const listing=mongoose.model("listing",listingschema);
module.exports = listing;
