require('dotenv').config();
const mongoose = require('mongoose');
const atlasUri = process.env.ATLAS_URI;
const localUri = 'mongodb://127.0.0.1:27017/wanderlust';
console.log('ATLAS_URI=' + atlasUri);
(async () => {
  if (atlasUri) {
    try {
      await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 5000 });
      const db = mongoose.connection.db;
      const cols = await db.listCollections().toArray();
      console.log('Atlas collections:', cols.map(c => c.name));
      const listingCount = await db.collection('listings').countDocuments();
      console.log('Atlas listings count:', listingCount);
      await mongoose.disconnect();
    } catch (e) {
      console.error('Atlas error:', e.message);
    }
  } else {
    console.log('Atlas URI not configured.');
  }
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Local collections:', cols.map(c => c.name));
    const listingCount = await db.collection('listings').countDocuments();
    console.log('Local listings count:', listingCount);
    await mongoose.disconnect();
  } catch (e) {
    console.error('Local error:', e.message);
  }
})();
