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

// Patrones de Bancolombia y PSE - MEJORADOS
const PATRONES = {
  // Compra con tarjeta: "Compraste COP12.900,00 en HOMECENTER..."
  compra: /Compraste COP([\d.,]+) en (.+?) con tu (.+?), el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/i,
  
  // Transferencia enviada: "Transferiste $1.000.000 desde tu cuenta..."
  transferenciaEnviada: /Transferiste \$([\d.,]+) desde tu cuenta \*(\d+) a la cuenta \*(\d+) el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/i,
  
  // Transferencia recibida: "Recibiste una transferencia por $21.000 de FULANO..."
  transferenciaRecibida: /Recibiste una transferencia por \$([\d.,]+) de (.+?) en tu cuenta \*+(\d+), el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/i,
  
  // Transferencia Nequi recibida: "Recibiste una transferencia de Nequi por $27.600..."
  transferenciaRecibidaNequi: /Recibiste una transferencia de Nequi por \$([\d.,]+).+?en la cuenta \*+(\d+).+?el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/i,
  
  // Avance de tarjeta: "Hiciste un avance por $100.000,00 en MF_STAMONI0..."
  avanceTarjeta: /Hiciste un avance por \$([\d.,]+) en (.+?) desde tu tarjeta.+?el (\d{2}:\d{2}) a las (\d{2}\/\d{2}\/\d{4})/i,
  
  // Avance alternativo (formato fecha invertido)
  avanceTarjetaAlt: /Hiciste un avance por \$([\d.,]+) en (.+?) desde tu tarjeta.+?a la cuenta.+?el (\d{2}\/\d{2}\/\d{4})/i,
  
  // Pago PSE: "Valor: $ 2.894.742 Empresa: FIDUCIARIA..."
  pse: /Valor:\s*\$\s*([\d.,]+)\s*Empresa:\s*(.+?)\s*Descripci[oó]n:\s*(.+?)\s*Fecha de la transacci[oó]n:\s*(\d{2}\/\d{2}\/\d{4})/i,
  
  // Retiro cajero: "Retiraste $200.000 desde tu cuenta..."
  retiroCajero: /Retiraste \$([\d.,]+) desde tu cuenta \*(\d+).+?el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/i,
  
  // Pago tarjeta crédito: "Pagaste $500.000 a tu tarjeta..."
  pagoTarjeta: /Pagaste \$([\d.,]+) a tu tarjeta.+?el (\d{2}\/\d{2}\/\d{4})/i
};

const CATEGORIAS = {
  'HOMECENTER': 'Hogar', 'EASY': 'Hogar', 'CONSTRUCTOR': 'Hogar',
  'EXITO': 'Mercado', 'CARULLA': 'Mercado', 'JUMBO': 'Mercado', 'D1': 'Mercado',
  'ARA': 'Mercado', 'OLIMPICA': 'Mercado', 'ALKOSTO': 'Mercado', 'EURO': 'Mercado',
  'RESTAURANTE': 'Alimentación', 'RAPPI': 'Alimentación', 'IFOOD': 'Alimentación',
  'UBER EATS': 'Alimentación', 'DOMINOS': 'Alimentación', 'MCDONALDS': 'Alimentación',
  'BURGUER': 'Alimentación', 'PIZZA': 'Alimentación', 'SUBWAY': 'Alimentación',
  'GASOLINA': 'Transporte', 'EDS': 'Transporte', 'TERPEL': 'Transporte',
  'TEXACO': 'Transporte', 'PRIMAX': 'Transporte', 'BRIO': 'Transporte',
  'UBER': 'Transporte', 'DIDI': 'Transporte', 'BEAT': 'Transporte', 'CABIFY': 'Transporte',
  'NETFLIX': 'Entretenimiento', 'SPOTIFY': 'Entretenimiento', 'YOUTUBE': 'Entretenimiento',
  'DISNEY': 'Entretenimiento', 'HBO': 'Entretenimiento', 'PRIME': 'Entretenimiento',
  'AMAZON': 'Compras Online', 'MERCADOLIBRE': 'Compras Online', 'MERCADO LIBRE': 'Compras Online',
  'SHEIN': 'Compras Online', 'ALIEXPRESS': 'Compras Online', 'LINIO': 'Compras Online',
  'DROGUER': 'Salud', 'FARMACIA': 'Salud', 'LOCATEL': 'Salud', 'CRUZ VERDE': 'Salud',
  'PREDIAL': 'Impuestos', 'FIDUCIARIA': 'Impuestos', 'DIAN': 'Impuestos',
  'ETB': 'Servicios', 'CLARO': 'Servicios', 'MOVISTAR': 'Servicios', 'TIGO': 'Servicios',
  'EPM': 'Servicios', 'EMCALI': 'Servicios', 'CODENSA': 'Servicios', 'ENEL': 'Servicios',
  'NUEVECINCO': 'Salario', 'NOMINA': 'Salario',
  'NEQUI': 'Transferencias', 'DAVIPLATA': 'Transferencias',
  'AVANCE': 'Avance Tarjeta', 'MF_': 'Avance Tarjeta', 'CAJERO': 'Retiro'
};

function detectarCategoria(descripcion) {
  if (!descripcion) return 'Otros';
  const desc = descripcion.toUpperCase();
  for (const [keyword, categoria] of Object.entries(CATEGORIAS)) {
    if (desc.includes(keyword)) return categoria;
  }
  return 'Otros';
}

// FUNCIÓN MEJORADA para parsear montos colombianos
function parsearMonto(montoStr) {
  if (!montoStr) return 0;
  
  // Limpiar el string
  let limpio = montoStr.toString().trim();
  
  // Caso: 12.900,00 (formato colombiano con decimales)
  if (limpio.includes(',') && limpio.indexOf(',') > limpio.lastIndexOf('.')) {
    // El punto es separador de miles, la coma es decimal
    limpio = limpio.replace(/\./g, '').replace(',', '.');
  }
  // Caso: 1.000.000 (solo puntos como separador de miles)
  else if ((limpio.match(/\./g) || []).length > 1) {
    limpio = limpio.replace(/\./g, '');
  }
  // Caso: 1,000,000 (comas como separador de miles)
  else if ((limpio.match(/,/g) || []).length > 1) {
    limpio = limpio.replace(/,/g, '');
  }
  // Caso: 1.000 o 1,000 (un solo separador - asumir miles)
  else if (limpio.includes('.') && limpio.split('.')[1]?.length === 3) {
    limpio = limpio.replace('.', '');
  }
  else if (limpio.includes(',') && limpio.split(',')[1]?.length === 3) {
    limpio = limpio.replace(',', '');
  }
  // Caso: 12,50 o 12.50 (decimal)
  else {
    limpio = limpio.replace(',', '.');
  }
  
  const resultado = parseFloat(limpio);
  return isNaN(resultado) ? 0 : Math.round(resultado); // Redondear a entero
}

function parsearFecha(fechaStr) {
  if (!fechaStr) return new Date().toISOString().split('T')[0];
  const [dia, mes, anio] = fechaStr.split('/');
  return `${anio}-${mes}-${dia}`;
}

function extraerTransaccion(texto) {
  if (!texto) return null;
  
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
      fuente: 'Bancolombia - Transferencia enviada'
    };
  }

  // Transferencia recibida normal
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

  // Transferencia recibida de Nequi
  match = texto.match(PATRONES.transferenciaRecibidaNequi);
  if (match) {
    return {
      tipo: 'ingreso',
      monto: parsearMonto(match[1]),
      categoria: 'Transferencias',
      descripcion: 'Transferencia de Nequi',
      remitente: 'Nequi',
      cuenta: match[2],
      fecha: parsearFecha(match[3]),
      hora: match[4],
      fuente: 'Bancolombia - Nequi'
    };
  }

  // Avance de tarjeta de crédito
  match = texto.match(PATRONES.avanceTarjeta);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: 'Avance Tarjeta',
      descripcion: `Avance en ${match[2].trim()}`,
      lugar: match[2].trim(),
      fecha: parsearFecha(match[4]), // La fecha y hora están invertidas en este formato
      hora: match[3],
      fuente: 'Bancolombia - Avance TC'
    };
  }
  
  // Avance alternativo
  match = texto.match(PATRONES.avanceTarjetaAlt);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: 'Avance Tarjeta',
      descripcion: `Avance en ${match[2].trim()}`,
      lugar: match[2].trim(),
      fecha: parsearFecha(match[3]),
      fuente: 'Bancolombia - Avance TC'
    };
  }

  // Retiro en cajero
  match = texto.match(PATRONES.retiroCajero);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: 'Retiro',
      descripcion: `Retiro cajero cuenta *${match[2]}`,
      cuenta: match[2],
      fecha: parsearFecha(match[3]),
      hora: match[4],
      fuente: 'Bancolombia - Retiro'
    };
  }

  // Pago de tarjeta de crédito
  match = texto.match(PATRONES.pagoTarjeta);
  if (match) {
    return {
      tipo: 'gasto',
      monto: parsearMonto(match[1]),
      categoria: 'Pago Tarjeta',
      descripcion: 'Pago a tarjeta de crédito',
      fecha: parsearFecha(match[2]),
      fuente: 'Bancolombia - Pago TC'
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

      // Buscar TODOS los correos de Bancolombia y PSE - aumentar maxResults
      const query = `from:(alertasynotificaciones@bancolombia.com.co OR alertasynotificaciones@an.notificacionesbancolombia.com OR serviciopse@achcolombia.com.co) after:${desde || '2024/01/01'}`;
      
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 500 // Aumentar para leer más correos
      });

      const messages = listResponse.data.messages || [];
      const transacciones = [];

      for (const msg of messages) {
        try {
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
          if (transaccion && transaccion.monto > 0) {
            transaccion.id = msg.id;
            transacciones.push(transaccion);
          }
        } catch (msgError) {
          console.error('Error processing message:', msgError);
          // Continuar con el siguiente mensaje
        }
      }

      // Ordenar por fecha más reciente
      transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      return { statusCode: 200, headers, body: JSON.stringify({ transacciones, total: transacciones.length }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
