// app.config.js reads env vars at build/start time via process.env.
// The existing app.json static config is merged here.
const appJson = require('./app.json');

module.exports = {
  ...appJson.expo,
  extra: {
    ...(appJson.expo.extra || {}),
    amplitudeApiKey: process.env.AMPLITUDE_API_KEY,
  },
};
