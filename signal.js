const express = require('express');
const http = require('http');
const { createConnection } = require('net');
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
const gamePeersWaiting = {};




io.on("connection", (socket) => {
    let player = false;

    socket.on("my_name_is", () =>{
        if(!peers[socket.id]){
            peers[socket.id] = socket.id;
        }
        socket.emit("you",socket.id);
        
    });
    
    socket.on("offer", (message) => {
        console.log("offer:")
        console.log(message)
        io.to(message.id).emit("offer", message);
    });

    socket.on("candidate", (message) => {
        io.to(message.id).emit("candidate", message);
    });
    
    socket.on("answer", message => {
        console.log("answer:")
        console.log(message)
        
        io.to(message.id).emit("answer", message);
    });

    socket.on("createRoom", (roomId) => {
        rooms[roomId] = [];
        io.sockets.emit("rooms",rooms);
        
    });

    socket.on("viewRooms", () => {
        socket.emit("rooms", rooms);
    });

    socket.on("joinRoom", (room) => {
        socket.emit("joinedRoom", rooms[room]);
        if(rooms[room]){
            rooms[room].push(socket.id); 
        }
        else{
            rooms[room] = [socket.id];
            io.sockets.emit("rooms",rooms);
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
    
    socket.on("disconnect", () => {
        for(const room in rooms){
            rooms[room].splice(rooms[room].indexOf(socket.id),1);
            if(rooms[room].length === 0){
                delete rooms[room];
            }else{
                rooms[room].forEach(socketId => {
                    io.to(socketId).emit("thisPeerLeft", socket.id);
                });
            }
        }
        delete peers[socket.id];    
        
        if(player){
            delete gamePeersWaiting[socket.id];
        }
    });



    // FOR PONG:

    //må også slette fra ventelista når man joiner et spill!

    socket.on("awaitingGame", () => {
        player = true;
        if(!gamePeersWaiting[socket.id]){
            gamePeersWaiting[socket.id] = socket.id;
        }
        //trenger jeg å lagre alle som er inni siden??
        // if(!peers[socket.id]){
        //     peers[socket.id] = socket.id;
        // }
        socket.emit("you",socket.id);
        if(Object.keys(gamePeersWaiting).length >= 2){
            //Sender ut ideen til den som har venta lengst
            socket.emit("gamePartnerId",gamePeersWaiting[Object.keys(gamePeersWaiting)[0]]);
        }
        else{
            socket.emit("waitForPartner");
        }
    });

    socket.on("gameOffer", (message) => {
        io.to(message.id).emit("gameOffer", message);
    });


});


server.listen(port,() => {
    console.log('signal server listening on port 8000');
});