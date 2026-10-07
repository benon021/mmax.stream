const config = {
  baseurl: 'https://zangetsu.cc',
  cdnApi: 'https://cdnanimo.xyz',
  embedCdn: 'https://cdn.4animo.xyz',
  flixera: 'https://flixera.co',
  origin: '*',
  port: 5000,

  headers: {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
  },

  logLevel: 'INFO',
  enableLogging: false,
  isProduction: true,
  isDevelopment: false,
  isVercel: false,
};

export default config;
