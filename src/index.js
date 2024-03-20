require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conexión a MongoDB exitosa');
    const port = app.get('port');

    const server = http.createServer(app);
    const io = new Server(server);

    app.set('io', io);

    io.on('connection', (socket) => {
      console.log('Un usuario se ha conectado');

      socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
      });
    });

    server.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error conectando a MongoDB:', err);
  }
}

main();