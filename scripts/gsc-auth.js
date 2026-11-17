const http = require('http');
const fs = require('fs');
const { google } = require('googleapis');

const cfg = require('../credentials/gsc-oauth.json').installed;
const redirect = 'http://localhost:3000/oauth2callback';
const auth = new google.auth.OAuth2(cfg.client_id, cfg.client_secret, redirect);
const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) return;
  const code = new URL(req.url, redirect).searchParams.get('code');
  if (!code) {
    res.end('Google yetkilendirme kodu bulunamadi.');
    return;
  }
  try {
    const { tokens } = await auth.getToken(code);
    fs.writeFileSync('credentials/gsc-token.json', JSON.stringify(tokens, null, 2));
    res.end('Tamamlandi. Bu pencereyi kapatabilirsiniz.');
    server.close();
    console.log('Google yetkilendirmesi tamamlandi.');
  } catch (e) {
    res.end('Yetkilendirme hatasi. Cursor terminalini kontrol edin.');
    console.error(e.message);
    server.close();
  }
});
server.listen(3000, () => {
  console.log('Google donus adresi hazir: http://localhost:3000');
  console.log(auth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
    prompt: 'consent'
  }));
});
