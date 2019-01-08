var crypto = require('crypto');
var _ = require('underscore');
var chat = require('./Chat.js');

function authorizationFailed(socket) {
    logger.info('socket '+socket.id+' failed to authorize');
    socket.json.send({type:'authResult',status:false});
};

module.exports.authorize=function (socket) {
    socket.on('message', function (msg) {

        logger.info('auth using msg',msg);

        if (msg.type!='auth' || !_.isString(msg.key)) {
            return authorizationFailed(socket);
        }

        var keyParts=msg.key.match(/^(\d+)([a-f0-9]{64})$/);
        if (!keyParts) {
            return authorizationFailed(socket);
        }

        var shasum = crypto.createHash('sha256');
        shasum.update(keyParts[1]+config.authorization.secret);

        if (shasum.digest('hex')!=keyParts[2]) {
            return authorizationFailed(socket);
        }

        var user_id=keyParts[1];

        logger.info('socket '+socket.id+' authorized as user '+user_id);

        function finishAuthorization() {
            socket.json.send({type:'authResult',status:true});

            socket.removeAllListeners();

            chat.addSocket(socket,user_id,msg.mobileType,msg.deviceUuid);
        }

        if (msg.mobileType) {
            dbQuery('update user_device set push_token=? where user_id=? and type=? and device_uuid=?',
                [msg.pushToken, user_id, msg.mobileType, msg.deviceUuid]
            ).then(function (result) {
                    dbQuery('update user_device set push_token=null where push_token=? and type=? and (device_uuid!=? or user_id!=?)',
                        [msg.pushToken, msg.mobileType, msg.deviceUuid, user_id]
                    ).then(function (result) {
                            finishAuthorization();
                        }).fail(function (error) {
                            logger.error(String(error));
                        });
                }).fail(function (error) {
                    logger.error(String(error));
                });
        } else {
            finishAuthorization();
        }
    });
}