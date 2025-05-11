const { app } = require('../../backend/src');
const serverless = require('serverless-http');

// Netlify Functions için Express uygulamasını serverless hale getir
const handler = serverless(app);

// Netlify Functions için export edilen handler
exports.handler = async (event, context) => {
  // API_PREFIX olmadan çalışacak şekilde path'i güncelle
  if (event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace('/.netlify/functions/api', '');
  }
  
  // path boşsa veya "/" ise, "/api" olarak varsay
  if (event.path === '/.netlify/functions/api' || event.path === '/.netlify/functions/api/') {
    event.path = '/';
  }

  return await handler(event, context);
}; 