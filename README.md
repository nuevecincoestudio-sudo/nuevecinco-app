# NUEVECINCO 💰

App de finanzas personales con sincronización automática de Bancolombia.

## Características

✅ **Sincronización automática** - Lee correos de Bancolombia y PSE  
✅ **Detección inteligente** - Compras, transferencias, pagos PSE  
✅ **Categorización automática** - Clasifica gastos automáticamente  
✅ **Presupuestos** - Define límites por categoría  
✅ **Metas de ahorro** - Registra progreso hacia tus metas  
✅ **Control de deudas** - Lleva seguimiento de lo que debes  
✅ **PWA** - Instálala en tu celular como app nativa  

## Despliegue en Netlify

### Paso 1: Subir a GitHub

1. Crea un repositorio nuevo en GitHub
2. Sube todos los archivos de este proyecto

### Paso 2: Conectar con Netlify

1. Ve a [netlify.com](https://netlify.com) e inicia sesión
2. Click en "Add new site" → "Import an existing project"
3. Selecciona GitHub y elige tu repositorio
4. Netlify detectará automáticamente la configuración
5. Click en "Deploy site"

### Paso 3: Configurar dominio personalizado (Opcional)

1. En Netlify, ve a "Site settings" → "Domain management"
2. Click en "Add custom domain"
3. O usa el dominio gratuito: `tu-sitio.netlify.app`

### Paso 4: Actualizar URI en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Navega a "APIs y servicios" → "Credenciales"
3. Edita tu cliente OAuth
4. Actualiza "URIs de redirección autorizados" con tu URL de Netlify:
   ```
   https://nuevecinco.netlify.app/auth/callback
   ```
   (Reemplaza con tu URL real si usaste otro nombre)

## Estructura del Proyecto

```
nuevecinco-app/
├── client/                 # Frontend React
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   └── App.jsx
│   └── package.json
├── netlify/
│   └── functions/
│       └── api.js         # Backend serverless
├── netlify.toml           # Configuración Netlify
└── README.md
```

## Tipos de transacciones detectadas

| Tipo | Fuente | Ejemplo |
|------|--------|---------|
| Compra con tarjeta | Bancolombia | "Compraste COP12.900,00 en HOMECENTER..." |
| Transferencia enviada | Bancolombia | "Transferiste $1,000,000 desde tu cuenta..." |
| Transferencia recibida | Bancolombia | "Recibiste una transferencia por $21,000..." |
| Pago PSE | ACH Colombia | "Valor: $2.894.742 Empresa: FIDUCIARIA..." |

## Categorización automática

La app detecta automáticamente la categoría basándose en el establecimiento:

- **HOMECENTER** → Hogar
- **EXITO, CARULLA, JUMBO, D1** → Mercado
- **RAPPI, UBER EATS** → Alimentación
- **TERPEL, UBER, DIDI** → Transporte
- **NETFLIX, SPOTIFY** → Entretenimiento
- **PREDIAL** → Impuestos
- Y más...

## Instalación como App (PWA)

### En Android (Chrome):
1. Abre la app en Chrome
2. Toca el menú (⋮)
3. Selecciona "Agregar a pantalla de inicio"

### En iPhone (Safari):
1. Abre la app en Safari
2. Toca el botón compartir
3. Selecciona "Agregar a pantalla de inicio"

## Seguridad

- Los tokens de Gmail se guardan solo en tu dispositivo (localStorage)
- No guardamos tus credenciales en ningún servidor
- La app solo tiene permiso de **lectura** de correos
- Puedes revocar el acceso en cualquier momento desde tu cuenta Google

## Soporte

Para reportar problemas o sugerencias, crea un issue en GitHub.

---

Hecho con ❤️ por NUEVECINCO ESTUDIO SAS
