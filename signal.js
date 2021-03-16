const { Console } = require('console');
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


io.on("connection", (socket) => {
    //console.log("on connection: " + socket.id);
    socket.on("my_name_is", (name)=>{
        if(!peers[socket.id]){
            peers[socket.id] = name;
        }
        socket.emit("you",socket.id);
        io.sockets.emit("peers",peers);
        
    });
    
    socket.on("offer", (message) => {
        io.to(message.id).emit("offer", message);
    });

    socket.on("candidate", (message) => {
        console.log(message)
        io.to(message.id).emit("candidate", message);
    });

    socket.on("answer", message => {
        io.to(message.id).emit("answer", message);
    });
    
    socket.on("disconnect", () => {
        delete peers[socket.id];
        io.sockets.emit("peers",peers);
        
    });
});


server.listen(port,() => {
    console.log('signal server listening on port 8000');
});