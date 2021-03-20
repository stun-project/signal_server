const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:'*'
    }
});
const port = 8000;

const peers = {};
const rooms = {};




io.on("connection", (socket) => {
    //console.log("on connection: " + socket.id);
    socket.on("my_name_is", () =>{
        if(!peers[socket.id]){
            peers[socket.id] = socket.id;
        }
        socket.emit("you",socket.id);
        
    });
    
    socket.on("offer", (message) => {
        io.to(message.id).emit("offer", message);
    });

    socket.on("candidate", (message) => {
        io.to(message.id).emit("candidate", message);
    });

    socket.on("createRoom", (room) => {
        if(!rooms[room.id]){
            rooms[room.id] = [socket.id];
            io.sockets.emit("rooms",rooms);
            socket.emit("roomCreationSuccess");
        }else{
            socket.emit("roomCreationError");
        }
    });

    socket.on("viewRooms", () => {
        socket.emit("rooms", rooms);
    });

    socket.on("joinRoom", (room) => {
        socket.emit("joinedRoom", rooms[room.id])
        rooms[room.id].push(socket.id);
    
    });

    socket.on("scout", (roomId, callbackFunc) => {
        callbackFunc(roomId in rooms);
    });

    socket.on("leaveRoom", (room) => {
        rooms[room.id].splice(rooms[room.id].indexOf(socket.id),1);
        if(rooms[room.id].length === 0){
            delete rooms[room.id];
        }else{
            rooms[room.id].forEach(socketId => {
                io.to(socketId).emit("thisPeerLeft", socket.id);
            });
        }
    });


    socket.on("answer", message => {
        io.to(message.id).emit("answer", message);
    });
    
    socket.on("disconnect", () => {
        delete peers[socket.id];
       // io.sockets.emit("peers",peers);
        
    });
});


server.listen(port,() => {
    console.log('signal server listening on port 8000');
});