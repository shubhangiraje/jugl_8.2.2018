var server = require('http').createServer();
var io = require('socket.io')(server);
var authorization = require ('./Authorization.js');

global.sockets=io.sockets;

io.sockets.on('connection', function (socket) {
    logger.info('connected socket '+socket.id);

    authorization.authorize(socket);
});

server.listen(config.publicServer.port);
logger.warn('starting chat server');
logger.info('PublicServer listen on '+config.publicServer.port+' port');
