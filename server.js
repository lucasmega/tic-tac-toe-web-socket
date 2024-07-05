const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let clients = [];
let gameState = {
  board: Array(9).fill(''),
  currentPlayer: 'X'
};

server.on('connection', (ws) => {
  clients.push(ws);
  ws.send(JSON.stringify(gameState));

  ws.on('message', (message) => {
    const { type, payload } = JSON.parse(message);

    if (type === 'MOVE') {
      gameState = payload;
      // Broadcast the updated game state to all clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(gameState));
        }
      });
    } else if (type === 'RESET') {
      gameState = {
        board: Array(9).fill(''),
        currentPlayer: 'X'
      };
      // Broadcast the reset game state to all clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(gameState));
        }
      });
    }
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

console.log('WebSocket server started on ws://localhost:8080');
