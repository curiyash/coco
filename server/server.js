const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();

const io = new Server(httpServer, {
	cors: {
		origin: "http://localhost:3000"
	}
});

const ACTIONS = {
    JOIN: 'join',
    JOINED: 'joined',
    DISCONNECTED: 'disconnected',
    CODE_CHANGE: 'code-change',
    SYNC_CODE: 'sync-code',
    LEAVE: 'leave',
};

// Need a user map to know which socket id belongs
// to which user
const userSocketMap = {};
function getAllConnectedClients(room_id){
	return Array.from(io.sockets.adapter.rooms.get(room_id) || []).map((socket_id) => {
		return {
			socket_id,
			username: userSocketMap[socket_id],
		}
	})
}

io.on('connection', (socket) => {
	console.log('Socket connected' + socket.id);
	console.log(ACTIONS.JOIN);

	socket.on('join', ({ room_id, username }) => {
		console.log(room_id);
		console.log(username);
		userSocketMap[socket.id] = username;
		socket.join(room_id);

		const clients = getAllConnectedClients(room_id);
		clients.forEach(({socket_id}) => {
			io.to(socket_id).emit('joined', {
				clients,
				username,
				socket_id: socket.id,
			});
		})
	})

	socket.on('disconnecting', () => {
		const rooms = [...socket.rooms];
		rooms.forEach((room_id) => {
			socket.in(room_id).emit('disconnected', {
				socket_id: socket.id,
				username: userSocketMap[socket.id],
			})
		})
		delete userSocketMap[socket.id];
		socket.leave();
	})

	socket.on('code change', ({room_id, code}) => {
		// Emit this code to every socket except the one
		// sending. Why? Causes issues with cursor position
		socket.in(room_id).emit('code change', {
			code
		})
	})

	socket.on('sync code', ({socket_id, code}) => {
		// Emit code to specific socket
		io.to(socket_id).emit('code change', {
			code
		})
	})

	socket.on('sync code after mode change', ({room_id, code}) => {
		// Emit code to specific socket
		io.in(room_id).emit('code change', {
			code
		})
	})

	socket.on('mode change', ({room_id, newMode, codeRef}) => {
		const code = codeRef.current;
		console.log(code);
		io.in(room_id).emit('mode change', {
			newMode,
			code
		})
	})

	// filename changes
	socket.on('filename change', ({room_id, fileName}) => {
		console.log("Here");
		console.log(fileName);
		io.in(room_id).emit('filename change', {
			fileName
		})
	})
});

httpServer.listen(5000, () => {
	console.log('listening on *:5000');
});
