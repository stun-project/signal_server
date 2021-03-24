const express = require("express");
const http = require("http");
const { createConnection } = require("net");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const port = 8000;

const peers = {};
const rooms = {};

io.on("connection", (socket) => {
  //console.log("on connection: " + socket.id);
  socket.on("my_name_is", () => {
    if (!peers[socket.id]) {
      peers[socket.id] = socket.id;
    }
    socket.emit("you", socket.id);
  });

  socket.on("offer", (message) => {
    io.to(message.id).emit("offer", message);
  });

  socket.on("candidate", (message) => {
    io.to(message.id).emit("candidate", message);
  });

  socket.on("answer", (message) => {
    io.to(message.id).emit("answer", message);
  });

  socket.on("createRoom", (roomId) => {
    console.log(`Creating room: ${roomId}`);
    rooms[roomId] = [];
    console.log(`Current rooms:${rooms}`);
    io.sockets.emit("rooms", rooms);
  });

  socket.on("viewRooms", () => {
    socket.emit("rooms", rooms);
  });

  socket.on("joinRoom", (room) => {
    socket.emit("joinedRoom", rooms[room]);
    console.log(
      `Attempting to join room${room}, here are the peers: ${rooms[room]}`
    );
    if (rooms[room]) {
      rooms[room].push(socket.id);
      console.log(`I, (${socket.id}) Join the room: ${room}`);
    } else {
      rooms[room] = [socket.id];
      console.log(`I, (${socket.id}) Created the room: ${room}`);
      io.sockets.emit("rooms", rooms);
    }
  });

  socket.on("scout", (roomId, callbackFunc) => {
    callbackFunc(roomId in rooms);
  });

  socket.on("leaveRoom", (room) => {
    // if(rooms[room]){
    //     rooms[room].splice(rooms[room].indexOf(socket.id),1);
    //     if(rooms[room].length === 0){
    //         delete rooms[room];
    //     }else{
    //         rooms[room].forEach(socketId => {
    //             io.to(socketId).emit("thisPeerLeft", socket.id);
    //         });
    //     }
    // }
  });

  socket.on("disconnect", (event) => {
    console.log(event);
    const disconnecting_peer = socket.id;
    console.log(
      `somebody disconnected, ${disconnecting_peer}, proceeding to remove from room`
    );

    for (const room in rooms) {
      // let x = rooms[room].splice(rooms[room].indexOf(socket.id), 1);
      console.log(`Checking: ${room}, content: ${rooms[room]}`);
      console.log(rooms[room]);
      if (
        rooms[room] == [] ||
        !rooms[room] ||
        rooms[room] === null ||
        rooms[room] === undefined ||
        rooms[room] == ""
      ) {
        console.log(
          `Room:${room} deleted because it was empty: ${rooms[room]}`
        );
        delete rooms[room];
      } else if (rooms[room].includes(disconnecting_peer)) {
        console.log(`Removing: ${disconnecting_peer} from room: ${room}`);
        const disconnecting_peer_index = rooms[room].indexOf(
          disconnecting_peer
        );
        rooms[room].splice(disconnecting_peer_index, 1);

        console.log(
          `Room: ${room}, now contains: ${rooms[room]}, transmitting leave message to all remaining peers`
        );

        delete peers[disconnecting_peer];

        rooms[room].forEach((socketId) => {
          io.to(socketId).emit("thisPeerLeft", disconnecting_peer);
        });
      }
    }
  });
});

server.listen(port, () => {
  console.log("signal server listening on port 8000");
});
