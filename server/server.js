const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity
    methods: ['GET', 'POST'],
  },
});

const MAX_PLAYERS = 3;
const rooms = {
  'room1': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 1000 },
  'room2': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 10000 },
  'room3': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 100000 },
};

app.use(cors());

const getRoom = (roomId) => rooms[roomId];

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, username }) => {
    const room = getRoom(roomId);
    if (room.players.length >= MAX_PLAYERS) {
      socket.emit('roomFull');
      return;
    }

    room.players.push({ id: socket.id, name: username });
    socket.join(roomId);
    io.to(roomId).emit('playerList', room.players);
    io.to(socket.id).emit('joinedRoom', true); // Signal that the user has joined the room

    socket.on('setReady', () => {
      if (!room.readyPlayers.includes(socket.id)) {
        room.readyPlayers.push(socket.id);
      } else {
        console.log(room.readyPlayers)
        room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      }

      io.to(roomId).emit('readyPlayers', room.readyPlayers);

      if (room.readyPlayers.length === MAX_PLAYERS) {
        io.to(roomId).emit('startCoinFlip');
      }
    });

    socket.on('chooseSide', (choice) => {
      room.playerChoices[socket.id] = choice;
      if (Object.keys(room.playerChoices).length === MAX_PLAYERS) {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const winners = [];
        const losers = [];

        for (let player in room.playerChoices) {
          if (room.playerChoices[player] === result) {
            winners.push(player);
          } else {
            losers.push(player);
          }
        }

        const winnings = winners.length > 0 ? room.betAmount * MAX_PLAYERS / winners.length : 0;
        const losses = room.betAmount;

        io.to(roomId).emit('gameResult', { result, winners, losers, winnings, losses });

        // Reset game state for next round
        room.readyPlayers = [];
        room.playerChoices = {};
      }
    });

    socket.on('disconnect', () => {
      room.players = room.players.filter(player => player.id !== socket.id);
      room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      delete room.playerChoices[socket.id];
      io.to(roomId).emit('playerList', room.players);
      io.to(roomId).emit('readyPlayers', room.readyPlayers);
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
