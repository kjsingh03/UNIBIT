const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
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
    io.to(socket.id).emit('joinedRoom', true);

    socket.on('setReady', () => {
      if (!room.readyPlayers.includes(socket.id)) {
        room.readyPlayers.push(socket.id);
      } else {
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

        const winnings = winners.length > 0 ? (room.betAmount * MAX_PLAYERS / winners.length)-room.betAmount : 0;
        const losses = room.betAmount;

        io.to(roomId).emit('gameResult', { result, winners, losers, winnings, losses });

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

  socket.on('resetGame', ({ roomId }) => {
    const room = rooms[roomId];

    room.readyPlayers = [];
    room.players = [];
    room.playerChoices = {};

    io.to(roomId).emit('readyPlayers', room.readyPlayers);
    io.to(roomId).emit('playerList', room.players);
  });

  socket.on('connect', () => {
    for (const roomId in rooms) {
      io.to(roomId).emit('playerList', rooms[roomId].players);
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
