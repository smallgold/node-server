var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 1000});

wss.on('connection', function (ws) {
  console.log('client connection');
  ws.on('message', function (msg) {
    console.log(msg);
  })
})