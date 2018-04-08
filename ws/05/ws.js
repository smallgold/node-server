var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var users = [];
var usersNum = 0;


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('login', function (data) {
    ++usersNum;

    users.push({
      username: data.username,
      message: []
    })
    socket.emit('loginSuccess', data);
  });
  socket.on('disconnect', function () {
    --usersNum;
    console.log('user disconnected');
  });
  socket.on('chat message', function (data) {
    //console.log(data.username +":" + data.message);
    for (let _user of users) {
      if (_user.username === data.username) {
        _user.message.push(data.message);
        //信息存储之后触发receiveMessage将信息发给所有浏览器  
        io.emit('receiveMessage', data);
        break;
      }
    }
  });
});

http.listen(1000, function () {
  console.log('listening on *:1000');
});

function wsSend() {

}






// 直接在浏览器里面运行 http://localhost:1000/ 即可