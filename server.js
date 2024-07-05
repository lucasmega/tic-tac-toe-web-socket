const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let clients = [];
let gameState = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  players: {}
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
  notifyPlayers();

  ws.on('message', (message) => {
    console.log('Received message:', message);
    const { type, payload } = JSON.parse(message);

    if (type === 'MOVE') {
      gameState = payload;
      console.log('Move received:', gameState);
      notifyPlayers();
    } else if (type === 'RESET') {
      gameState = {
        board: Array(9).fill(''),
        currentPlayer: 'X',
        players: {}
      };
      assignSymbols();
      console.log('Game reset');
      notifyPlayers();
    }
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
      gameState.players = {};
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

function notifyPlayers() {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(gameState));
      client.send(JSON.stringify({ type: 'USER_COUNT', payload: clients.length }));
    }
  });
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
