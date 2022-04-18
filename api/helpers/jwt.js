const expressJwt = require('express-jwt');

const secret = process.env.SECRET;
const api = process.env.API_URL;

function authJwt() {
  return expressJwt({
    secret,
    algorithms: ['HS256'],
    isRevoked,
  }).unless({
    path: [
      { url: /\/public\/upload(.*)/, methods: ['GET', 'OPTIONS'] },
      { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
      { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
      `${api}/users/register`,
      `${api}/users/login`,
    ],
  });
}

async function isRevoked(req, payload, done) {
  if (!payload.isAdmin) {
    done(null, true);
  }

  done();
}

module.exports = authJwt;
