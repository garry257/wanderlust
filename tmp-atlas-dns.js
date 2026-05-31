const dns = require('dns');
dns.setServers(['8.8.8.8']);
console.log('dns', dns.getServers());
dns.resolve4('ac-ik92gci-shard-00-00.fy1cwbg.mongodb.net', (err, addrs) => {
  if (err) {
    console.error('resolve4 error', err);
  } else {
    console.log('resolve4', addrs);
  }
  dns.resolve6('ac-ik92gci-shard-00-00.fy1cwbg.mongodb.net', (err6, addrs6) => {
    if (err6) {
      console.error('resolve6 error', err6);
    } else {
      console.log('resolve6', addrs6);
    }
    process.exit(0);
  });
});
