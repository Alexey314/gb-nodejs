const io = require("socket.io");
const http = require("http");
const path = require("path");
const fs = require("fs");

const server = http.createServer((req,res)=>{
  if (req.method === 'GET') {

    const filePath = path.join(__dirname, 'index.html');

    const readStream = fs.createReadStream(filePath);

    readStream.pipe(res);
  } else if (req.method === 'POST') {
    let data = '';

    req.on('data', chunk => {
	data += chunk;
    });

    req.on('end', () => {
      const parsedData = JSON.parse(data);
      console.log(parsedData);

      res.writeHead(200, { 'Content-Type': 'json'});
      res.end(data);
    });
  } else {
      res.statusCode = 405;
      res.end();
  }
});

server.listen(5555, "localhost");

const socket = io(server);

socket.on('connection', function (client) {
  console.log('New connection');
  client.broadcast.emit("NEW_CLIENT_CONNECTED");
  broadcastUsersCount(socket);
  client.on('CLIENT_MSG', (data) => {
    socket.emit('SERVER_MSG', data);
  });

  client.on('CLIENT_RECONNECT', (data) => {
    client.broadcast.emit('CLIENT_RECONNECTED', data);
    broadcastUsersCount(socket);
  });

  client.on("disconnect", (data) => {
    client.broadcast.emit('CLIENT_DISCONNECTED', data);
    broadcastUsersCount(socket);
  });
});

function broadcastUsersCount(socket){
  socket.emit('SERVER_USERS_COUNT', {usersCount: socket.of("/").sockets.size});
}