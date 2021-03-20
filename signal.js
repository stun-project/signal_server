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

    socket.on("createRoom", (roomId) => {
        rooms[roomId] = [socket.id];
        io.sockets.emit("rooms",rooms);
        
    });

    socket.on("viewRooms", () => {
        socket.emit("rooms", rooms);
    });

    socket.on("joinRoom", (room) => {
        console.log(rooms[room])
        if(rooms[room]){
            socket.emit("joinedRoom", rooms[room])
            rooms[room].push(socket.id); 
        }
        
    
    });

    socket.on("scout", (roomId, callbackFunc) => {
        callbackFunc(roomId in rooms);
    });

    socket.on("leaveRoom", (room) => {
        if(rooms[room]){
            console.log(rooms[room])
            console.log(socket.id)
            console.log(rooms[room].indexOf(socket.id))
            rooms[room].splice(rooms[room].indexOf(socket.id),1);
            if(rooms[room].length === 0){
                delete rooms[room];
            }else{
                rooms[room].forEach(socketId => {
                    io.to(socketId).emit("thisPeerLeft", socket.id);
                });
            }
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