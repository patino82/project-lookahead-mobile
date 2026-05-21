const open = require('open');
const { execSync } = require('child_process');

// Minimal smoke script instructions. This script will print the redirect URI
// and open the Expo dev tools in the default browser. The developer must
// manually complete the Google consent in the emulator/device when prompted.

(async function main(){
  try {
    // Print instructions and the redirect URI used by expo-auth-session with proxy
    console.log('\nMobile auth smoke test (manual step required)');
    console.log('1) Start the Expo dev server (expo start) in another terminal if not running.');
    console.log('2) Launch the app in emulator or Expo Go.');
    console.log('3) The app uses AuthSession.makeRedirectUri({useProxy:true}).');
    console.log('   When you tap Continue with Google, the Expo proxy will open a browser for Google consent.');
    console.log('4) Complete the Google consent in the browser/emulator.');
    console.log('\nTo help, this script will attempt to open the Expo devtools in your default browser.');

    try {
      execSync('open "http://localhost:19002"', { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }

    console.log('\nWhen the Google consent flow completes, verify the backend at /api/auth/exchange returns a cookie or JSON with accessToken.');
    console.log('Check AsyncStorage keys: accessToken and sessionType to determine which flow was used.');
    console.log('\nScript complete. Follow the manual steps above to finish the auth flow.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
