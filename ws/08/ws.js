var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var users = [];
var roomInfo = {}


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/jquery.js', function (req, res) {
  res.sendFile(__dirname + '/jquery.min.js');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('login', function (data) {
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
      // 储存当前登录用户索引值
      socket.userNum = num;
      socket.emit('loginSuccess', users[num]);
    } else {
      socket.emit('loginSuccess', 'none');
    }
    
    console.log(users)
  });

  socket.on('addGroup', function(data, user){
    var roomID = data;
    // 将用户加入房间名单中
    if (!roomInfo[roomID]) {
      roomInfo[roomID] = []
    }

    roomInfo[roomID].push(user);
    // 加入房间
    socket.join(roomID)
    console.log(socket.userNum, user.username)
    if (users[socket.userNum].username === user.username) {
      users[socket.userNum].group.push(data);
      console.log(users)
    }

    // 通知房间内人员
    socket.emit('addGroupSuccess',data);
  })

  socket.on('joinRoom', function(data){
    // 将用户加入房间名单中
    roomInfo[roomID].push(data);
    // 在线人数
    usersNum++;

    // 加入房间
    socket.join(roomID) 
    var postData = {
      user: data.username,
      len: usersNum,
    }
    // 通知房间内人员
    io.to(roomID).emit('online',postData);
  })

  socket.on('register', function (data) {
    // 判断用户名是否重复
    for (var i=0; i<users.length; i++) {
      if (data.username == users[i].username) {
        socket.emit('registerSuccess', 'used');
        return;
      }
    }
    users.push({
      id: uuid.v4(),
      avatar: '',
      username: data.username,
      friends: [],
      group: [],
    })
    socket.emit('registerSuccess');
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');

    /* for(var i=0; i<users.length; i++) {
      if (roomInfo[roomID][i].username === socket.username) {
        // 退出该聊天室就删除该用户
        // roomInfo[roomID].splice(i,1);
        // 在线人数
        usersNum--;
        break;
      }
    }
    
    var postData = {
      user: socket.username,
      len: usersNum,
    }

    // 退出房间
    socket.leave(roomID);
    io.to(roomID).emit('outline',postData) */
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