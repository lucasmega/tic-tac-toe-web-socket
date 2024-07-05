const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let clients = [];
let gameState = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  players: {},
  scores: {}
};

server.on('connection', (ws) => {
  ws.id = generateUniqueId();
  clients.push(ws);
  console.log('New client connected with ID:', ws.id);

  if (clients.length > 2) {
    ws.send(JSON.stringify({ type: 'ROOM_FULL' }));
    closeConnectionById(ws.id);
    return;
  }

  assignSymbols();
  initializeScores();
  notifyPlayers();

  ws.on('message', (message) => {
    console.log('Received message:', message);
    const { type, payload } = JSON.parse(message);

    if (type === 'MOVE') {
      gameState.board = payload.board;
      gameState.currentPlayer = payload.currentPlayer;
      const winner = checkWinner();
      if (winner) {
        gameState.scores[winner]++;
        notifyPlayers();
        setTimeout(resetGame, 2000); // Reinicia o jogo após 2 segundos
      } else {
        notifyPlayers();
      }
    } else if (type === 'RESET') {
      resetGame();
    }
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
    if (clients.length < 2) {
      gameState.players = {};
      gameState.scores = {};
    }
    notifyPlayers();
    console.log('Client disconnected with ID:', ws.id);
  });
});

function assignSymbols() {
  const symbols = ['X', 'O'];
  clients.forEach((client, index) => {
    const symbol = symbols[index];
    gameState.players[client.id] = symbol;
    client.send(JSON.stringify({ type: 'ASSIGN_SYMBOL', payload: symbol }));
  });
}

function initializeScores() {
  clients.forEach(client => {
    if (!(client.id in gameState.scores)) {
      gameState.scores[client.id] = 0;
    }
  });
}

function notifyPlayers() {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(gameState));
      client.send(JSON.stringify({ type: 'USER_COUNT', payload: clients.length }));
    }
  });
}

function checkWinner() {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // linhas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colunas
    [0, 4, 8], [2, 4, 6] // diagonais
  ];
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;
    if (gameState.board[a] && gameState.board[a] === gameState.board[b] && gameState.board[a] === gameState.board[c]) {
      const winnerId = Object.keys(gameState.players).find(key => gameState.players[key] === gameState.board[a]);
      console.log(`Player with ID ${winnerId} won`);
      return winnerId;
    }
  }
  return null;
}

function resetGame() {
  gameState.board = Array(9).fill('');
  gameState.currentPlayer = 'X';
  notifyPlayers();
}

function generateUniqueId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

function closeConnectionById(id) {
  const client = clients.find(client => client.id === id);
  if (client) {
    client.close();
    clients = clients.filter(c => c !== client);
    console.log(`Closed connection for client with ID: ${id}`);
    notifyPlayers();
  } else {
    console.log(`Client with ID: ${id} not found`);
  }
}

console.log('WebSocket server started on ws://localhost:8080');
