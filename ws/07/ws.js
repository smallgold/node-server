var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var users = [
      {
        username:"aaa",
        message: []
      },
      {
        username:"bbb",
        message: []
      },
    ];
var usersNum = 0;
var roomInfo = {}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  var roomID = 'room1';   // 获取房间ID
  socket.on('login', function (data) {

    // 将用户加入房间名单中
    roomInfo[roomID] = users;

    // 加入房间
    socket.join(roomID)
    // 判断用户名是否存在
    var hasUser = null;
    var num = 0;
    for (var i=0; i<users.length; i++) {
      if (data.username === users[i].username) {
        hasUser = true;
        num = i;
        break;
      } else {
        hasUser = false;
      }
    }
    // 登录成功进入聊天室
    if (hasUser) {
      // 在线人数
      usersNum++;
      // 储存当前登录用户
      socket.username = data.username;
      socket.emit('loginSuccess', users[num], roomID);
    } else {
      socket.emit('loginSuccess', 'none');
    }
    
    var postData = {
      user: data.username,
      len: usersNum,
    }
    // 通知房间内人员
    io.to(roomID).emit('online',postData)
    console.log(users)
  });

  socket.on('register', function (data) {
    
    // 判断用户名是否重复
    for (var i=0; i<users.length; i++) {
      if (data.username == users[i].username) {
        socket.emit('registerSuccess', 'used');
        return;
      }
    }
    users.push({
      username: data.username,
      message: []
    })
    socket.emit('registerSuccess');
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');

    if (typeof roomInfo[roomID] !== "object") {
      return;
    }

    for(var i=0; i<users.length; i++) {
      if (roomInfo[roomID][i].username === socket.username) {
        // 退出该聊天室就删除该用户
        // roomInfo[roomID].splice(i,1);
        // 在线人数
        usersNum--;
        break;
      }
    }

    console.log(roomInfo[roomID])
    var postData = {
      user: socket.username,
      len: usersNum,
    }

    // 退出房间
    socket.leave(roomID);
    io.to(roomID).emit('outline',postData)
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




// 直接在浏览器里面运行 http://localhost:1000/ 即可