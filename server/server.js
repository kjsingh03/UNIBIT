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

const MAX_PLAYERS = 30;
const MIN_PLAYERS_TO_START = 2;
const START_GAME_DELAY = 2000;

const rooms = {
  'room1': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 1000, startGameTimer: null },
  'room2': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 10000, startGameTimer: null },
  'room3': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 100000, startGameTimer: null },
};

app.use(cors());

const getRoom = (roomName) => rooms[roomName];

const startGame = (roomName) => {
  const room = getRoom(roomName);

  if (room.startGameTimer) {
    clearTimeout(room.startGameTimer);
    room.startGameTimer = null;
  }

  room.players.forEach(player => {
    if (!room.readyPlayers.includes(player.id)) {
      io.to(player.id).emit('removePlayer');
    }
  });

  // room.players = room.players.filter(player => room.readyPlayers.includes(player.id));

  if (room.readyPlayers.length >= MIN_PLAYERS_TO_START) {
    room.players.forEach(player => {
      const betChoice = Math.random() < 0.5 ? 'heads' : 'tails';
      room.playerChoices[player.id] = betChoice;
    });

    room.readyPlayers = room.players.filter(player => room.readyPlayers.includes(player.id));

    io.to(roomName).emit('playerList', room.players);
    room.readyPlayers.forEach(player => {
      io.to(player.id).emit('startCoinFlip');
    });

    room.playerChoices = {};
  } else {
    room.readyPlayers = [];
    room.playerChoices = {};
  }
};

io.on('connection', (socket) => {

  socket.on('enterRoom', ({ roomName }) => {
    const room = getRoom(roomName);
    console.log(room.players)
    io.to(roomName).emit('playerList', room.players);
    io.to(roomName).emit('readyPlayers', room.readyPlayers);
  })

  socket.on('joinRoom', ({ roomName, username }) => {
    const room = getRoom(roomName);
    if (room.players.length >= MAX_PLAYERS) {
      socket.emit('roomFull');
      return;
    }

    room.players.push({ id: socket.id, name: username });
    socket.join(roomName);
    io.to(roomName).emit('playerList', room.players);
    io.to(roomName).emit('readyPlayers', room.readyPlayers);
    io.to(socket.id).emit('joinedRoom', true);

    socket.on('setReady', () => {
      const room = getRoom(roomName);

      if (!room.readyPlayers.includes(socket.id)) {
        room.readyPlayers.push(socket.id);
      } else {
        room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      }

      io.to(roomName).emit('readyPlayers', room.readyPlayers);

      if (room.readyPlayers.length === MAX_PLAYERS) {
        clearTimeout(room.startGameTimer);
        startGame(roomName);
      }

      if (room.readyPlayers.length >= MIN_PLAYERS_TO_START && !room.startGameTimer) {
        io.to(roomName).emit('startGameTimer', START_GAME_DELAY / 1000)
        room.startGameTimer = setTimeout(() => {
          startGame(roomName);
        }, START_GAME_DELAY);
      }

      if (room.readyPlayers.length < MIN_PLAYERS_TO_START && room.startGameTimer) {
        io.to(roomName).emit('startGameTimer', 0)
        clearTimeout(room.startGameTimer);
        room.startGameTimer = null;
      }
    });

    socket.on('chooseSide', (choice) => {
      const room = getRoom(roomName);
      room.playerChoices[socket.id] = choice;

      if (Object.keys(room.playerChoices).length === room.readyPlayers.length) {
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

        const winnings = winners.length > 0 ? (room.betAmount * room.readyPlayers.length / winners.length) - room.betAmount : 0;
        const losses = room.betAmount;

        io.to(roomName).emit('gameResult', { result, winners, losers, winnings, losses });
        io.to(roomName).emit('playerList', room.players.map(player => ({
          id: player.id,
          name: player.name,
          betChoice: room.playerChoices[player.id] || null
        })));

        room.readyPlayers = [];
        room.playerChoices = {};
      }
    });

    socket.on('disconnect', () => {
      const room = getRoom(roomName);
      room.players = room.players.filter(player => player.id !== socket.id);
      room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      delete room.playerChoices[socket.id];

      if (room.players.length === 0) {
        room.readyPlayers = [];
        room.playerChoices = {};
      }

      io.to(roomName).emit('playerList', room.players);
      io.to(roomName).emit('readyPlayers', room.readyPlayers);
    });

    socket.on('leaveRoom', ({ roomName }) => {
      const room = getRoom(roomName);
      room.players = room.players.filter(player => player.id !== socket.id);
      room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      delete room.playerChoices[socket.id];

      if (room.players.length === 0) {
        room.readyPlayers = [];
        room.playerChoices = {};
      }

      io.to(roomName).emit('playerList', room.players);
      io.to(roomName).emit('readyPlayers', room.readyPlayers);
      io.to(roomName).emit('startGameTimer', 0);
      if (room.readyPlayers.length < MIN_PLAYERS_TO_START && room.startGameTimer) {
        clearTimeout(room.startGameTimer);
        room.startGameTimer = null;
      }
    });

    socket.on('resetGame', ({ roomName }) => {
      const room = getRoom(roomName);
      room.readyPlayers = [];
      room.players = [];
      room.playerChoices = {};
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
