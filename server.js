const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create Express app and HTTP server
const app = express();
app.use(cors());
const server = http.createServer(app);

// Create Socket.io server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow only port 3000
    methods: ['GET', 'POST'],
  },
});

// Store connected users
const users = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle new user joining
  socket.on('user_join', (username) => {
    users[socket.id] = username;
    console.log(`${username} joined the chat`);
    
    // Broadcast to all clients
    io.emit('user_join', {
      username,
      userId: socket.id,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle chat messages
  socket.on('chat_message', (data) => {
    console.log(`Message from ${users[socket.id]}: ${data.message}`);
    
    // Broadcast the message to all clients
    io.emit('chat_message', {
      username: users[socket.id],
      userId: socket.id,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', {
      userId: socket.id,
      username: users[socket.id],
      isTyping
    });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      console.log(`${username} left the chat`);
      delete users[socket.id];
      
      // Broadcast user departure
      io.emit('user_left', {
        username,
        userId: socket.id,
        message: `${username} left the chat`,
        timestamp: new Date().toISOString(),
      });
    }
  });
});

// Start server
const PORT = 4000; // Fixed port 4000
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});