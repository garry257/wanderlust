const mongoose = require('mongoose');
const listing = require('../models/listing.js');

async function fixData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
        console.log('Connected to DB');
        
        const listings = await listing.find({}).lean();
        for (let rawL of listings) {
            let l = await listing.findById(rawL._id);
            if (typeof rawL.image === 'string') {
                console.log('Found string image for:', l.title);
                if (rawL.image.includes('url:')) {
                    // Extract URL using regex
                    const match = rawL.image.match(/url:\s*['"]([^'"]+)['"]/);
                    if (match) {
                        l.image = { url: match[1], filename: 'listingimage' };
                    } else {
                        l.image = { url: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60', filename: 'listingimage' };
                    }
                } else {
                    l.image = { url: rawL.image, filename: 'listingimage' };
                }
                await l.save();
                console.log('Fixed:', l.title);
            }
        }
        console.log('Data fix complete');
    } catch (err) {
        console.error('Error fixing data:', err);
    } finally {
        mongoose.disconnect();
    }
}

fixData();
