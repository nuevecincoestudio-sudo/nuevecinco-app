const { google } = require('googleapis');

const CLIENT_ID = '1003228522054-ro8t7hnfbej6fth6rpsmb6td0jou7bod.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://nuevecinco.netlify.app/auth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Headers CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Patrones de Bancolombia y PSE
const PATRONES = {
  compra: /Compraste COP([\d.,]+) en (.+?) con tu (.+?), el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/,
  transferenciaEnviada: /Transferiste \$([\d.,]+) desde tu cuenta \*(\d+) a la cuenta \*(\d+) el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/,
  transferenciaRecibida: /Recibiste una transferencia por \$([\d.,]+) de (.+?) en tu cuenta \*+(\d+), el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/,
  pse: /Valor: \$ ([\d.,]+)Empresa: (.+?)Descripción: (.+?)Fecha de la transacción: (\d{2}\/\d{2}\/\d{4})/
};

const CATEGORIAS = {
  'HOMECENTER': 'Hogar', 'EXITO': 'Mercado', 'CARULLA': 'Mercado', 'JUMBO': 'Mercado',
  'D1': 'Mercado', 'ARA': 'Mercado', 'OLIMPICA': 'Mercado', 'ALKOSTO': 'Mercado',
  'RESTAURANTE': 'Alimentación', 'RAPPI': 'Alimentación', 'IFOOD': 'Alimentación',
  'UBER EATS': 'Alimentación', 'GASOLINA': 'Transporte', 'EDS': 'Transporte',
  'TERPEL': 'Transporte', 'TEXACO': 'Transporte', 'UBER': 'Transporte', 'DIDI': 'Transporte',
  'NETFLIX': 'Entretenimiento', 'SPOTIFY': 'Entretenimiento', 'AMAZON': 'Compras Online',
  'MERCADOLIBRE': 'Compras Online', 'DROGUER': 'Salud', 'FARMACIA': 'Salud', 'LOCATEL': 'Salud',
  'PREDIAL': 'Impuestos', 'FIDUCIARIA': 'Impuestos', 'ETB': 'Servicios', 'CLARO': 'Servicios',
  'MOVISTAR': 'Servicios', 'EPM': 'Servicios', 'EMCALI': 'Servicios', 'NUEVECINCO': 'Salario',
};

function detectarCategoria(descripcion) {
  const desc = descripcion.toUpperCase();
  for (const [keyword, categoria] of Object.entries(CATEGORIAS)) {
    if (desc.includes(keyword)) return categoria;
  }
  return 'Otros';
}

function parsearMonto(montoStr) {
  return parseFloat(montoStr.replace(/\./g, '').replace(',', '.'));
}

function parsearFecha(fechaStr) {
  const [dia, mes, anio] = fechaStr.split('/');
  return `${anio}-${mes}-${dia}`;
}

function extraerTransaccion(texto) {
  let match = texto.match(PATRONES.compra);
  if (match) {
    return {
      tipo: 'gasto', monto: parsearMonto(match[1]), categoria: detectarCategoria(match[2]),
      descripcion: match[2].trim(), tarjeta: match[3], fecha: parsearFecha(match[4]),
      hora: match[5], fuente: 'Bancolombia - Compra'
    };
  }

  match = texto.match(PATRONES.transferenciaEnviada);
  if (match) {
    return {
      tipo: 'gasto', monto: parsearMonto(match[1]), categoria: 'Transferencias',
      descripcion: `Transferencia a cuenta *${match[3]}`, cuentaOrigen: match[2],
      cuentaDestino: match[3], fecha: parsearFecha(match[4]), hora: match[5],
      fuente: 'Bancolombia - Transferencia'
    };
  }

  match = texto.match(PATRONES.transferenciaRecibida);
  if (match) {
    return {
      tipo: 'ingreso', monto: parsearMonto(match[1]), categoria: detectarCategoria(match[2]),
      descripcion: `Transferencia de ${match[2].trim()}`, remitente: match[2].trim(),
      cuenta: match[3], fecha: parsearFecha(match[4]), hora: match[5],
      fuente: 'Bancolombia - Transferencia recibida'
    };
  }

  match = texto.match(PATRONES.pse);
  if (match) {
    return {
      tipo: 'gasto', monto: parsearMonto(match[1]),
      categoria: detectarCategoria(match[2] + ' ' + match[3]),
      descripcion: `${match[3]} - ${match[2]}`, empresa: match[2], concepto: match[3],
      fecha: parsearFecha(match[4]), fuente: 'PSE'
    };
  }

  return null;
}

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  
  try {
    // GET /auth/url - Obtener URL de autenticación
    if (path === '/auth/url' && event.httpMethod === 'GET') {
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        prompt: 'consent'
      });
      return { statusCode: 200, headers, body: JSON.stringify({ url }) };
    }

    // POST /auth/token - Intercambiar código por token
    if (path === '/auth/token' && event.httpMethod === 'POST') {
      const { code } = JSON.parse(event.body);
      const { tokens } = await oauth2Client.getToken(code);
      return { statusCode: 200, headers, body: JSON.stringify({ tokens }) };
    }

    // POST /auth/refresh - Refrescar token
    if (path === '/auth/refresh' && event.httpMethod === 'POST') {
      const { refresh_token } = JSON.parse(event.body);
      oauth2Client.setCredentials({ refresh_token });
      const { credentials } = await oauth2Client.refreshAccessToken();
      return { statusCode: 200, headers, body: JSON.stringify({ tokens: credentials }) };
    }

    // POST /gmail/transacciones - Obtener transacciones de Gmail
    if (path === '/gmail/transacciones' && event.httpMethod === 'POST') {
      const { access_token, refresh_token, desde } = JSON.parse(event.body);
      
      oauth2Client.setCredentials({ access_token, refresh_token });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const query = `from:(alertasynotificaciones@bancolombia.com.co OR alertasynotificaciones@an.notificacionesbancolombia.com OR serviciopse@achcolombia.com.co) after:${desde || '2024/01/01'}`;
      
      const listResponse = await gmail.users.messages.list({
        userId: 'me', q: query, maxResults: 100
      });

      const messages = listResponse.data.messages || [];
      const transacciones = [];

      for (const msg of messages) {
        const fullMsg = await gmail.users.messages.get({
          userId: 'me', id: msg.id, format: 'full'
        });

        let body = '';
        const payload = fullMsg.data.payload;
        
        if (payload.body && payload.body.data) {
          body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } else if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body && part.body.data) {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8');
              break;
            }
            if (part.mimeType === 'text/html' && part.body && part.body.data) {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
          }
        }

        body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        const transaccion = extraerTransaccion(body);
        if (transaccion) {
          transaccion.id = msg.id;
          transacciones.push(transaccion);
        }
      }

      transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      return { statusCode: 200, headers, body: JSON.stringify({ transacciones }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
