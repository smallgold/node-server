var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var users = [];
var roomInfo = {}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  //console.log('a user connected');
  var roomID = 'room1';   // 获取房间ID
  socket.on('login', function (data) {

    // 判断用户名是否重复
    for (var i=0; i<users.length; i++) {
      if (data.username == users[i].username) {
        socket.emit('loginSuccess', 'used');
        return;
      }
    }
    socket.username = data.username;
    users.push({
      username: data.username,
      message: []
    })

    // 将用户加入房间名单中
    roomInfo[roomID] = users;

    // 加入房间
    socket.join(roomID)
    // 通知房间内人员
    io.to(roomID).emit('getUsersNum',users.length)
    socket.emit('loginSuccess', data, roomID);
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
    if (typeof roomInfo[roomID] !== "object") {
      return;
    }
    for (var i=0; i<roomInfo[roomID].length; i++) {
      if (roomInfo[roomID][i].username === socket.username) {
        roomInfo[roomID].splice(i,1)
      }
    }
    // 退出房间
    socket.leave(roomID);
    io.to(roomID).emit('getUsersNum',users.length)
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