var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = []; // 所有用户
var roomInfo = {} // 所有群聊


app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/jquery.js', function (req, res) {
  res.sendFile(__dirname + '/jquery.min.js');
});

app.get('/ws.css', function (req, res) {
  res.sendFile(__dirname + '/ws.css');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('register', function (data) {
    // 判断用户名是否重复
    for (var i = 0; i < users.length; i++) {
      if (data.username == users[i].username) {
        socket.emit('registerSuccess', 'used');
        return;
      }
    }
    users.push({
      id: socket.id, // 用socket提供的ID进行定向推送信息或者其他事件；每次刷新浏览器ID会变；
      avatar: '',
      username: data.username,
      messages: [],
      friends: [],
      groups: [],
      strangers: [],
    })
    socket.emit('registerSuccess');
  });

  socket.on('login', function (data) {
    // 判断用户名是否存在
    var hasUser = null;
    var num = 0;
    for (var i in users) {
      if (data.username === users[i].username) {
        hasUser = true;
        num = i;
        users[i].id = socket.id;
        break;
      } else {
        hasUser = false;
      }
    }
    // 登录成功进入聊天室
    if (hasUser) {
      // 储存当前登录用户索引值
      socket.userNum = num;
      socket.name = data.username;
      socket.emit('loginSuccess', users[num]);
    } else {
      socket.emit('loginSuccess', 'none');
    }

    //console.log(users)
  });

  socket.on('addFriend', function (data, user) {
    // 判断所有用户有无此人
    var hasFriend = false;

    if (socket.name === data) {
      socket.emit('addFriendSuccess', 'self');
      return;
    }

    for (var i in users) {
      if (users[i].username === data) {
        hasFriend = true;
        break;
      } else {
        hasFriend = false;
      }
    }

    if (hasFriend) {
      // 判断用户列表有无此好友
      for (var i = 0; i < users[socket.userNum].friends.length; i++) {
        if (users[socket.userNum].friends[i] === data) {
          socket.emit('addFriendSuccess', 'already');
          return;
        }
      }

      // 判断对方列表有无此陌生人
      for (var i = 0; i < users[socket.userNum].strangers.length; i++) {
        if (users[socket.userNum].strangers[i] === data) {
          users[socket.userNum].strangers.splice(i, 1);
          users[socket.userNum].friends.push(data);
          socket.emit('addFriendSuccess', 'stranger', data);
          return;
        }
      }

      // 默认添加好友后设置自己为对方的陌生人
      for (var i in users) {
        if (users[i].username === data) {
          users[i].strangers.push(users[socket.userNum].username);
          io.to(users[i].id).emit('addStrangerSuccess', users[socket.userNum].username);
          break;
        }
      }

      // 添加好友成功
      users[socket.userNum].friends.push(data);
      socket.emit('addFriendSuccess', data);
    } else {
      socket.emit('addFriendSuccess', 'none');
    }
  })

  socket.on('addGroup', function (data, user) {
    // 将用户加入房间名单中
    if (!roomInfo[data]) {
      roomInfo[data] = []
    }

    users[socket.userNum].groups.map((v) => {
      if (v === data) {
        socket.emit('addGroupSuccess', 'none');
        return;
      }
    })

    roomInfo[data].push(user);
    // 加入房间
    socket.join(data)

    if (users[socket.userNum].username === user.username) {
      users[socket.userNum].groups.push(data);
    }

    // 添加群组成功
    socket.emit('addGroupSuccess', data);
  })

  socket.on('joinGroup', function (data, user) {
    // 将用户加入房间名单中
    roomInfo[data].push(user.username);
    // 在线人数
    // usersNum++;
    // 加入房间
    socket.join(data)

    for (var i in users) {
      if (users[i].username === user.username) {
        users[i].groups.push(data);
        break;
      }
    }

    var postData = {
      user: user.username,
      groupName: data,
      //len: usersNum,
    }
    // 通知房间内人员
    io.to(data).emit('online', postData);
  })

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
    // 发送方
    for (var i in users) {
      if (users[i].username === data.username) {
        users[i].messages.push(data.message);
        //信息存储之后触发sendMessage将信息发给发送方
        io.to(users[i].id).emit('sendMessage', data);
        break;
      }
    }
    // 接收方
    for (var i in users) {
      if (users[i].username === data.touser) {
        //getMessage将信息发给接收方
        io.to(users[i].id).emit('getMessage', data, users[i]);
        break;
      }
    }
  });
});

http.listen(1000, function () {
  console.log('listening on *:1000');
});





// 直接在浏览器里面运行 http://localhost:1000/ 即可