require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8']);
console.log('dns', dns.getServers());
const mongoose = require('mongoose');
console.log('connecting');
mongoose.connect(process.env.ATLAS_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  .then(() => {
    console.log('ok');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
