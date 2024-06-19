require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Web3 } = require('web3');
const PoolContractABI = require('./PoolContractABI.json'); // Ensure ABI is in JSON format

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL)); // Initialize Web3 with Infura URL
const contractAddress = process.env.CONTRACT_ADDRESS;
const poolContract = new web3.eth.Contract(PoolContractABI, contractAddress);

const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
const ownerAddress = process.env.OWNER_ADDRESS;

const MAX_PLAYERS = 3;
const MIN_PLAYERS_TO_START = 2;
const START_GAME_DELAY = 10000;

const rooms = {
  'room1': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 100, startGameTimer: null, result: Math.random() < 0.5 ? 'heads' : 'tails', random: Math.floor(Math.random() * new Date().getTime()),roomCreated:false },
  'room2': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 10000, startGameTimer: null, result: Math.random() < 0.5 ? 'heads' : 'tails', random: Math.floor(Math.random() * new Date().getTime()),roomCreated:false },
  'room3': { players: [], readyPlayers: [], playerChoices: {}, betAmount: 100000, startGameTimer: null, result: Math.random() < 0.5 ? 'heads' : 'tails', random: Math.floor(Math.random() * new Date().getTime()),roomCreated:false },
};

let receipt;

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

const createRoom = async (roomId) => {
  const replacer = (key, value) => {
    return typeof value === 'bigint' ? value.toString() : value;
  };

  try {
    const createRoomData = poolContract.methods.createRoom(roomId).encodeABI();

    const gasEstimate = await web3.eth.estimateGas({ from: ownerAddress, to: contractAddress, data: createRoomData });

    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
      from: ownerAddress,
      to: contractAddress,
      gas: gasEstimate,
      gasPrice: gasPrice,
      data: createRoomData,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, ownerPrivateKey);

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt;
  } catch (error) {
    console.error('Error while creating room:', error.message);
  }
};

const decideWon = async (roomId, walletAddress) => {
  try {
    const createRoomData = poolContract.methods.decideWon(roomId, walletAddress).encodeABI();

    const gasEstimate = await web3.eth.estimateGas({ from: ownerAddress, to: contractAddress, data: createRoomData });

    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
      from: ownerAddress,
      to: contractAddress,
      gas: gasEstimate,
      gasPrice: gasPrice,
      data: createRoomData,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, ownerPrivateKey);

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt;
  } catch (error) {
    console.error('Error while creating room:', error.message);
  }
};

const distributePool = async (roomId) => {
  try {
    const createRoomData = poolContract.methods.distributePool(roomId).encodeABI();

    const gasEstimate = await web3.eth.estimateGas({ from: ownerAddress, to: contractAddress, data: createRoomData });

    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
      from: ownerAddress,
      to: contractAddress,
      gas: gasEstimate,
      gasPrice: gasPrice,
      data: createRoomData,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, ownerPrivateKey);

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return receipt;
  } catch (error) {
    console.error('Error while creating room:', error.message);
  }
};

io.on('connection', (socket) => {

  socket.on('enterRoom', ({ roomName }) => {
    const room = getRoom(roomName);
    io.to(roomName).emit('playerList', room.players);
    io.to(roomName).emit('readyPlayers', room.readyPlayers);
  });

  socket.on('joinRoom', async ({ roomName, username }) => {
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

    if (room.players.length === 1) {
      receipt = await createRoom(room.random);
      io.to(roomName).emit('roomIdGenerated', { random: room.random, result: room.result });
      room.roomCreated=true
    };

    if(room.roomCreated)
      io.to(roomName).emit('roomIdGenerated', { random: room.random, result: room.result });

    socket.on('setReady', () => {
      const room = getRoom(roomName);
      if (!room.readyPlayers.includes(socket.id)) {
        room.readyPlayers.push(socket.id);
      } else {
        room.readyPlayers = room.readyPlayers.filter(id => id !== socket.id);
      }

      io.to(roomName).emit('roomIdGenerated', { result: room.result, random: room.random });

      io.to(roomName).emit('readyPlayers', room.readyPlayers);

      if (room.readyPlayers.length === MAX_PLAYERS) {
        clearTimeout(room.startGameTimer);
        startGame(roomName);
      }

      if (room.readyPlayers.length >= MIN_PLAYERS_TO_START && !room.startGameTimer) {
        io.to(roomName).emit('startGameTimer', START_GAME_DELAY / 1000);
        room.startGameTimer = setTimeout(() => {
          startGame(roomName);
        }, START_GAME_DELAY);
      }

      if (room.readyPlayers.length < MIN_PLAYERS_TO_START && room.startGameTimer) {
        io.to(roomName).emit('startGameTimer', 0);
        clearTimeout(room.startGameTimer);
        room.startGameTimer = null;
      }
    });

    socket.on('chooseSide', async ({ choice, walletAddress }) => {
      const room = getRoom(roomName);
      room.playerChoices[socket.id] = choice;

      if (Object.keys(room.playerChoices).length === room.readyPlayers.length) {
        const winners = [];
        const losers = [];

        let tempWin;

        for (let playerId in room.playerChoices) {
          if (room.playerChoices[playerId] === room.result) {
            winners.push(playerId);
          } else {
            losers.push(playerId);
          }
        }

        const winnings = winners.length > 0 ? (room.betAmount * room.readyPlayers.length / winners.length) - room.betAmount : 0;
        const losses = room.betAmount;

        io.to(roomName).emit('playerList', room.players.map(player => ({
          id: player.id,
          name: player.name,
          betChoice: room.playerChoices[player.id] || null
        })));

        io.to(roomName).emit('gameResult', { result: room.result, winners, losers, winnings, losses });
        
        for (let playerId in room.playerChoices) {
          if (room.playerChoices[playerId] === room.result) {
            tempWin = await decideWon(room.random, walletAddress)
            console.log(tempWin)
          }
        }

        const result = await distributePool(room.random)

        room.readyPlayers = [];
        room.playerChoices = {};
        room.result = Math.random() < 0.5 ? 'heads' : 'tails'
        room.random = Math.floor(Math.random() * new Date().getTime())
        room.roomCreated=false
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
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});