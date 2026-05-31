require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8','1.1.1.1']);
console.log('dns', dns.getServers());
const mongoose = require('mongoose');
mongoose.connect(process.env.ATLAS_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log('ok');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
