'use strict';

var app = require('express')();
var	server = require('http').createServer(app);
var	io = require('socket.io').listen(server);
var	fs = require('fs');

var serverPort = 3000;
var socketStates = {};
var users = {};
var ids = {};

server.listen(serverPort, function () {
	console.log('server is running on '+serverPort);
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});

app.get('/bittools.js', function(req, res){
  res.sendFile(__dirname + '/client/bittools.js');
});

io.on('connection', function(socket){
  socketStates[socket.id] = {
    state: 0,
    userId: makeUserId()
  };
  ids[socketStates[socket.id].userId] = socket.id;

	console.log("User connected on " + socket.id + " [ID] " + socketStates[socket.id].userId);

  socket.on('disconnect', function(){
    if(socketStates[socket.id] != undefined){
			console.log("User " + socket.id + " disconnecting");
      if(socketStates[socket.id].userId in ids){
        delete ids[socketStates[socket.id].userId];
      }
      delete socketStates[socket.id];
		}else{
			console.log('Untracked user disconnected');
		}
  });

  socket.on('GetId', () => {
    socket.emit('IdReply', socketStates[socket.id].userId);
  });
  
  socket.on('SendPartnerRequest', (target) => {
    if(target in ids){
      socket.emit('PartnerRequestResult', 1);
      io.to(ids[target]).emit('RecvPartnerRequest', socketStates[socket.id].userId);
      socketStates[socket.id].partner = ids[target];
      socketStates[ids[target]].partner = socket.id;
    }else{
      socket.emit('PartnerRequestResult', 0);
    }
  });
  
  socket.on('PartnerResponse', (isAccepted) => {
    if(socketStates[socket.id].partner === undefined)
      return;
    
    if(isAccepted){
      io.to(socketStates[socket.id].partner).emit('PartnerRequestResult', 2);
    }else{
      io.to(socketStates[socket.id].partner).emit('PartnerRequestResult', 3);
      //Undo partnering
      socketStates[socketStates[socket.id].partner].partner = undefined;
      socketStates[socket.id].partner = undefined;
    }
  });
  
  socket.on('SendOffer', (offer) => {
    if(socketStates[socket.id].partner === undefined)
      return;
    
    io.to(socketStates[socket.id].partner).emit('RecvOffer', offer);
  });
  
  socket.on('OfferReply', (answer) => {
    io.to(socketStates[socket.id].partner).emit('RecvAnswer', answer);
  });
  
  socket.on('SendIceCandidate', (candidate) => {
    io.to(socketStates[socket.id].partner).emit('RecvIceCandidate', candidate);
  });
});

function makeUserId() {
  var text = "";
  var possible = "0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

	if(text in ids){
		return makeUserId();
	}

  return text;
}