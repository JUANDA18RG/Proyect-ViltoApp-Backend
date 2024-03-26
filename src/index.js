const app = require('./app');
const http = require('http');
const { Server: WebsocketServer } = require('socket.io');
const {connectDB} = require('./database');

connectDB();

const server = http.createServer(app);
const httpServer = server.listen(3000);

const io = new WebsocketServer(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST" , "PUT" , "DELETE"]
  }
});

require('./Sockets')(io);