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
const MIN_PLAYERS_TO_START = 2;
const START_GAME_DELAY = 5000; // 15 seconds

const rooms = {
  'room1': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 1, startGameTimer: null },
  'room2': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 10000, startGameTimer: null },
  'room3': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 100000, startGameTimer: null },
};

app.use(cors());

const getRoom = (roomId) => rooms[roomId];

const startGame = (roomId) => {
  const room = getRoom(roomId);

  if (room.startGameTimer) {
    clearTimeout(room.startGameTimer);
    room.startGameTimer = null;
  }
  
    room.players.forEach(player => {
      if (!room.readyPlayers.includes(player.id)) {
        io.to(player.id).emit('removePlayer');
        }
    });

  room.players = room.players.filter(player => room.readyPlayers.includes(player.id));


  if (room.readyPlayers.length >= MIN_PLAYERS_TO_START) {
    room.players.forEach(player => {
      const betChoice = Math.random() < 0.5 ? 'heads' : 'tails';
      room.playerChoices[player.id] = betChoice;
    });

    io.to(roomId).emit('playerList', room.players);
    io.to(roomId).emit('startCoinFlip');
    io.to(roomId).emit('gameStarted', { betAmount: room.betAmount, playerChoices: room.playerChoices });

    room.readyPlayers = [];
    room.playerChoices = {};
  } else {
    room.readyPlayers = [];
    room.playerChoices = {};
  }
};

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
    io.to(roomId).emit('readyPlayers', room.readyPlayers);
    io.to(socket.id).emit('joinedRoom', true);

    socket.on('setReady', () => {
      const room = getRoom(roomId);

      if (!room.readyPlayers.includes(socket.id)) {
        room.readyPlayers.push(socket.id);
      } else {
        room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      }

      io.to(roomId).emit('readyPlayers', room.readyPlayers);

      if (room.readyPlayers.length === MAX_PLAYERS) {
        clearTimeout(room.startGameTimer); // Clear any existing start game timer
        startGame(roomId); // Start the game immediately
      }

      if (room.readyPlayers.length >= MIN_PLAYERS_TO_START && !room.startGameTimer) {
        room.startGameTimer = setTimeout(() => {
          startGame(roomId); // Start the game after the delay
        }, START_GAME_DELAY);
      }

      if (room.readyPlayers.length < MIN_PLAYERS_TO_START && room.startGameTimer) {
        clearTimeout(room.startGameTimer);
        room.startGameTimer = null;
      }
    });

    socket.on('chooseSide', (choice) => {
      const room = getRoom(roomId);
      room.playerChoices[socket.id] = choice;

      if (Object.keys(room.playerChoices).length === room.players.length) {
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const winners = [];
        const losers = [];

        for (let playerId in room.playerChoices) {
          if (room.playerChoices[playerId] === result) {
            winners.push(playerId);
          } else {
            losers.push(playerId);
          }
        }

        const winnings = winners.length > 0 ? (room.betAmount * room.players.length / winners.length) - room.betAmount : 0;
        const losses = room.betAmount;

        io.to(roomId).emit('gameResult', { result, winners, losers, winnings, losses });
        io.to(roomId).emit('playerList', room.players.map(player => ({
          id: player.id,
          name: player.name,
          betChoice: room.playerChoices[player.id] || null
        })));

        room.readyPlayers = [];
        room.playerChoices = {};
      }
    });

    socket.on('disconnect', () => {
      const room = getRoom(roomId);
      room.players = room.players.filter(player => player.id !== socket.id);
      room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      delete room.playerChoices[socket.id];

      if (room.players.length === 0) {
        room.readyPlayers = [];
        room.playerChoices = {};
      }

      io.to(roomId).emit('playerList', room.players);
      io.to(roomId).emit('readyPlayers', room.readyPlayers);
    });

    socket.on('leaveRoom', ({ roomId }) => {
      const room = getRoom(roomId);
      room.players = room.players.filter(player => player.id !== socket.id);
      room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      delete room.playerChoices[socket.id];

      if (room.players.length === 0) {
        room.readyPlayers = [];
        room.playerChoices = {};
      }

      io.to(roomId).emit('playerList', room.players);
      io.to(roomId).emit('readyPlayers', room.readyPlayers);
    });

    socket.on('resetGame', ({ roomId }) => {
      const room = getRoom(roomId);
      room.readyPlayers = [];
      room.players = [];
      room.playerChoices = {};

      io.to(roomId).emit('resetGame');
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
