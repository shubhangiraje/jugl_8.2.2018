var http = require("http");
var Q=require('q');

var server = http.createServer(function(req, res) {

    function error(code,message) {
        var response='<h1>'+code+' '+message+'</h1>';
        res.writeHead(code, {
            "Content-Type": "text/html",
            "Content-Length": response.length
        });
        res.end(response);
    }

    if (req.method!=='POST') {
        return error(400,'Bad Request (1)');
    }

    if (!req.connection.remoteAddress.match(config.rpcServer.allowedIPs)) {
        return error(403,'Forbidden');
    }

    var requestBody='';

    req.on('data', function (chunk) {
        requestBody += chunk;
        if (requestBody.length>config.rpcServer.maxBodySize) {
            error(400,'Bad Request (2)');
        }
    });

    req.on('end', function () {
        var request={};

        try {
            request=JSON.parse(requestBody);
        } catch (exception) {
            return error(400,'Bad Request (3)');
        }

        var response={};

        logger.info('>>> GOT RPC REQUEST '+req.url,request);
        switch (req.url) {
            case '/message/send':
                response=processMessageSend(request);
                break;
            case '/initInfo/update':
                response=processInitInfoUpdate(request);
                break;
            case '/status/update':
                response=processStatusUpdate(request);
                break;
            case '/event/new':
                response=processEventNew(request);
                break;
            case '/pushMessage/send':
                response=processPushMessageSend(request);
                break;
            case '/pushMessage/sendExt':
                response=processPushMessageSendExt(request);
                break;
            case '/systemMessage/send':
                response=processSendSystemMessageToChat(request);
                break;
            case '/user/info':
                response=processUserInfo(request);
                break;
            case '/broadcast':
                response=processBroadcast(request);
                break;
            default:
                return error(404,'Not Found');
        }

        response.then(function(data){
            logger.info('<<< SEND RESPONSE ',data);
            var responseBody=JSON.stringify(data);
            res.writeHead(200, {
                "Content-Type": "application/json",
                "Content-Length": responseBody.length
            });
            res.end(responseBody);
        }).fail(function(){
            var responseBody='Error';
            res.writeHead(200, {
                "Content-Type": "text/html",
                "Content-Length": responseBody.length
            });
            res.end(responseBody);
        });
    });
});

function processBroadcast(request) {
    global.chat.broadcast(request);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processUserInfo(request) {
    return global.chat.getUserInfo(request.user_id);
}

function processStatusUpdate(request) {
    global.chat.sendStatusUpdate(request.user_ids,request.options);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processEventNew(request) {
    global.chat.newEvent(request);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processPushMessageSend(request) {
    setTimeout(function(){
        global.chat.pushMessageSend(request);
    },request.sound ? 2000:0);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processPushMessageSendExt(request) {
    global.chat.pushMessageSendExt(request);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processMessageSend(request) {
    global.chat.sendMessage(request.user_id,request.message);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processSendSystemMessageToChat(request) {
    global.chat.sendSystemMessageToChat(request.user_id,request.message);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

function processInitInfoUpdate(request) {
    global.chat.updateInitInfo(request.user_ids);
    return Q.Promise(function (resolve, reject, notify){resolve({});});
}

server.listen(config.rpcServer.port);
logger.info("RpcServer is listening on "+config.rpcServer.port+" port");
