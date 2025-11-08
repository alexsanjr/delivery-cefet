const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_WEB_APP = process.env.KONG_JWT_SECRET_WEB_APP || 'your-secret-key-web-app';
const SECRET_ADMIN = process.env.KONG_JWT_SECRET_ADMIN_PANEL || 'your-secret-key-admin-panel';

app.post('/auth/login', (req, res) => {
  const { issuer = 'web-app' } = req.body || {};

  const secret = issuer === 'admin-panel' ? SECRET_ADMIN : SECRET_WEB_APP;
  const key = issuer === 'admin-panel' ? 'admin-panel-issuer' : 'web-app-issuer';

  const token = jwt.sign(
    {
      iss: key,
      sub: 'test-user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
    },
    secret,
    { algorithm: 'HS256' }
  );

  res.json({
    token,
    expires_in: 3600,
    token_type: 'Bearer',
    issuer: key
  });
});

app.get('/auth/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
