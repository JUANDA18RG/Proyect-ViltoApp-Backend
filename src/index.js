const app = require('./app');
const http = require('http');
const cors = require('cors');
const { Server: WebsocketServer } = require('socket.io');
const { connectDB } = require('./database');
const IA = require('./IA');

// Conectar a la base de datos
connectDB();

// Configurar CORS
app.use(cors());

// Crear servidor HTTP
const server = http.createServer(app);

// Escuchar en el puerto 3000
const httpServer = server.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});

// Configurar servidor WebSocket con opciones CORS
const origin =  process.env.VITE_FRONTEND_URL;

const io = new WebsocketServer(httpServer, {
  cors: {
    origin: origin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Importar y configurar eventos de socket
require('./Sockets')(io);