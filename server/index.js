const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración OAuth
const CLIENT_ID = '1003228522054-ro8t7hnfbej6fth6rpsmb6td0jou7bod.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://nuevecinco.netlify.app/auth/callback'
  : 'http://localhost:3000/auth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Patrones de Bancolombia y PSE
const PATRONES = {
  compra: /Compraste COP([\d.,]+) en (.+?) con tu (.+?), el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/,
  transferenciaEnviada: /Transferiste \$([\d.,]+) desde tu cuenta \*(\d+) a la cuenta \*(\d+) el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/,
  transferenciaRecibida: /Recibiste una transferencia por \$([\d.,]+) de (.+?) en tu cuenta \*+(\d+), el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/,
  pse: /Valor: \$ ([\d.,]+)Empresa: (.+?)Descripción: (.+?)Fecha de la transacción: (\d{2}\/\d{2}\/\d{4})/
};

// Categorías automáticas basadas en establecimiento
const CATEGORIAS = {
  'HOMECENTER': 'Hogar',
  'EXITO': 'Mercado',
  'CARULLA': 'Mercado',
  'JUMBO': 'Mercado',
  'D1': 'Mercado',
  'ARA': 'Mercado',
  'OLIMPICA': 'Mercado',
  'ALKOSTO': 'Mercado',
  'RESTAURANTE': 'Alimentación',
  'RAPPI': 'Alimentación',
  'IFOOD': 'Alimentación',
  'UBER EATS': 'Alimentación',
  'GASOLINA': 'Transporte',
  'EDS': 'Transporte',
  'TERPEL': 'Transporte',
  'TEXACO': 'Transporte',
  'UBER': 'Transporte',
  'DIDI': 'Transporte',
  'NETFLIX': 'Entretenimiento',
  'SPOTIFY': 'Entretenimiento',
  'AMAZON': 'Compras Online',
  'MERCADOLIBRE': 'Compras Online',
  'DROGUER': 'Salud',
  'FARMACIA': 'Salud',
  'LOCATEL': 'Salud',
  'PREDIAL': 'Impuestos',
  'FIDUCIARIA': 'Impuestos',
  'ETB': 'Servicios',
  'CLARO': 'Servicios',
  'MOVISTAR': 'Servicios',
  'EPM': 'Servicios',
  'EMCALI': 'Servicios',
  'NUEVECINCO': 'Salario',
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
  // Compra con tarjeta
  let match = texto.match(PATRONES.compra);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: detectarCategoria(match[2]),
      descripcion: match[2].trim(),
      tarjeta: match[3],
      fecha: parsearFecha(match[4]),
      hora: match[5],
      fuente: 'Bancolombia - Compra'
    };
  }

  // Transferencia enviada
  match = texto.match(PATRONES.transferenciaEnviada);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: 'Transferencias',
      descripcion: `Transferencia a cuenta *${match[3]}`,
      cuentaOrigen: match[2],
      cuentaDestino: match[3],
      fecha: parsearFecha(match[4]),
      hora: match[5],
      fuente: 'Bancolombia - Transferencia'
    };
  }

  // Transferencia recibida
  match = texto.match(PATRONES.transferenciaRecibida);
  if (match) {
    return {
      tipo: 'ingreso',
      monto: parsearMonto(match[1]),
      categoria: detectarCategoria(match[2]),
      descripcion: `Transferencia de ${match[2].trim()}`,
      remitente: match[2].trim(),
      cuenta: match[3],
      fecha: parsearFecha(match[4]),
      hora: match[5],
      fuente: 'Bancolombia - Transferencia recibida'
    };
  }

  // Pago PSE
  match = texto.match(PATRONES.pse);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: detectarCategoria(match[2] + ' ' + match[3]),
      descripcion: `${match[3]} - ${match[2]}`,
      empresa: match[2],
      concepto: match[3],
      fecha: parsearFecha(match[4]),
      fuente: 'PSE'
    };
  }

  return null;
}

// Rutas de autenticación
app.get('/api/auth/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent'
  });
  res.json({ url });
});

app.post('/api/auth/token', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    res.json({ tokens });
  } catch (error) {
    console.error('Error getting token:', error);
    res.status(500).json({ error: 'Error al obtener token' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    oauth2Client.setCredentials({ refresh_token });
    const { credentials } = await oauth2Client.refreshAccessToken();
    res.json({ tokens: credentials });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Error al refrescar token' });
  }
});

// Ruta para obtener transacciones de Gmail
app.post('/api/gmail/transacciones', async (req, res) => {
  try {
    const { access_token, refresh_token, desde } = req.body;
    
    oauth2Client.setCredentials({ access_token, refresh_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Buscar correos de Bancolombia y PSE
    const query = `from:(alertasynotificaciones@bancolombia.com.co OR alertasynotificaciones@an.notificacionesbancolombia.com OR serviciopse@achcolombia.com.co) after:${desde || '2024/01/01'}`;
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100
    });

    const messages = listResponse.data.messages || [];
    const transacciones = [];

    for (const msg of messages) {
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      // Extraer el cuerpo del correo
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

      // Limpiar HTML si es necesario
      body = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

      const transaccion = extraerTransaccion(body);
      if (transaccion) {
        transaccion.id = msg.id;
        transacciones.push(transaccion);
      }
    }

    // Ordenar por fecha más reciente
    transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({ transacciones });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Error al obtener correos', details: error.message });
  }
});

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
