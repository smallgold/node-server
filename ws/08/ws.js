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

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('register', function (data) {
    // 判断用户名是否重复
    for (var i=0; i<users.length; i++) {
      if (data.username == users[i].username) {
        socket.emit('registerSuccess', 'used');
        return;
      }
    }
    users.push({
      id: socket.id,  // 用socket提供的ID进行定向推送信息或者其他事件；
      avatar: '',
      username: data.username,
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
      socket.name = data.username;
      socket.emit('loginSuccess', users[num]);
    } else {
      socket.emit('loginSuccess', 'none');
    }
    
    console.log(users)
  });

  socket.on('addFriend', function(data, user){
    // 判断所有用户有无此人
    var hasFriend = false;

    if (socket.name === data) {
      socket.emit('addFriendSuccess', 'self');
      return;
    }


    

    for (var i=0; i<users.length; i++) {
      if (users[i].username === data) {
        hasFriend = true;
        break;
      } else {
        hasFriend = false;
      }
    }

    if (hasFriend) {
      // 判断用户列表有无此好友
      for (var i=0; i<users[socket.userNum].friends.length; i++) {
        if (users[socket.userNum].friends[i] === data){
          socket.emit('addFriendSuccess', 'already');
          break;
        }
      }
      
      for (var i=0; i<users.length; i++) {
        if (users[i].username === data) {
          users[i].strangers.push(users[socket.userNum].username);
          io.to(users[i].id).emit('addStrangerSuccess',users[socket.userNum].username);
          break;
        }
      }

      users[socket.userNum].friends.push(data);
      // 添加好友成功
      socket.emit('addFriendSuccess',data);
    } else {
      socket.emit('addFriendSuccess', 'none');
    }
  })

  socket.on('addGroup', function(data, user){
    var roomID = data;
    // 将用户加入房间名单中
    if (!roomInfo[roomID]) {
      roomInfo[roomID] = []
    }

    users[socket.userNum].groups.map((v)=>{
      if (v === data){
        socket.emit('addGroupSuccess', 'none');
        return;
      }
    })

    roomInfo[roomID].push(user);
    // 加入房间
    socket.join(roomID)
    
    if (users[socket.userNum].username === user.username) {
      users[socket.userNum].groups.push(data);
    }

    // 添加群组成功
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