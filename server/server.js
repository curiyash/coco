const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();

const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000"
    }
});

io.on('connection', (socket) => {
  console.log('Socket connected' + socket.id);
});

httpServer.listen(5000, () => {
  console.log('listening on *:5000');
});
