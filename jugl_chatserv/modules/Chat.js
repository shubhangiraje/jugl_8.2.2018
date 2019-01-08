var Q=require('q');
var crypto = require('crypto');
var _ = require('underscore');
var userRelations = require('./UserRelations.js');

var googlePushService = require('node-gcm');
var googlePushServiceSender = new googlePushService.Sender(config.googlePushService.key);

global.chat={};


var microsoftPushService = require('mpns');

function socketJsonSend(socket,msg) {
    logger.info('>> SEND MSG SOCKET '+socket.id+' TYPE '+msg.type);
    //logger.info(msg);
    socket.json.send(msg);
}

var applePushService = require('apn');
logger.info('APN config',config.applePushService);
var applePushServiceConnection=applePushService.connection(config.applePushService);

applePushServiceConnection.on("connected", function() {
    logger.info('APN connected');
});

applePushServiceConnection.on("transmitted", function(notification, device) {
    logger.info("APN Notification transmitted to:" + device.token.toString("hex"));
});

applePushServiceConnection.on("transmissionError", function(errCode, notification, device) {
    logger.error("APN Notification caused error: " + errCode + " for device ", device, notification);
    if (errCode === 8) {
        logger.info("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
    }
    logger.info('APN connection settings',applePushServiceConnection.options);
});

applePushServiceConnection.on("timeout", function () {
    logger.info("APN Connection Timeout");
});

applePushServiceConnection.on("disconnected", function() {
    logger.info("APN Disconnected");
});

applePushServiceConnection.on("socketError", function(error) {
    logger.error('APN socket error: '+error);
});


var users={};

var mobileMessagesAwaitingDelivery={};


function sendToUser(user,msg) {
    if (!user || !user.sockets)  {
        return;
    }
    for(var socketIdx in user.sockets) {
        var socketId=user.sockets[socketIdx];
        if (sockets.connected[socketId]) {
            logger.info("send msg to user "+user.id,msg);
            socketJsonSend(sockets.connected[socketId],msg);
        }
    }
}


function pushMessageToAndroid(srcUser,dstUser,devices,msg,payload,pushType) {
    if (!_.isArray(devices) || devices.length==0) return;

    for(var i in devices) {
        var message = new googlePushService.Message({
            collapseKey: String(srcUser ? srcUser.id:msg.title)
        });

        message.addData(_.clone(payload));
        message.addData('title', srcUser ? srcUser.info.userName:msg.title);
        message.addData('message', msg.text);

        if (!devices[i].setting_sound_all || !devices[i]['setting_sound_'+pushType]) {
            message.addData('sound', false);
        } else {
            if (msg.sound) {
                message.addData('soundname', msg.sound.replace(/\.[^.]*$/, ''));
            }
        }

        var ids=[devices[i].push_token];

        //logger.info("push message to android device ", ids);
        googlePushServiceSender.send(message, ids, function (err, result) {
            //logger.info("android push result: "+err, result);
        });
    }
}


function pushMessageToIos(srcUser,dstUser,devices,msg,payload,pushType) {
    if (!_.isArray(devices) || devices.length==0) return;

    for(var i in devices) {
        var notification = new applePushService.notification();
        notification.setAlertText((srcUser ? srcUser.info.userName:msg.title) + ': ' + msg.text);
        if (devices[i].setting_sound_all && devices[i]['setting_sound_'+pushType]) {
            notification.setSound(msg.sound ? msg.sound:'default');
        }
        notification.payload = _.clone(payload);
        //notification.badge = 1;

        applePushServiceConnection.pushNotification(notification, devices[i].push_token);
        //logger.info("push message to ios device ", devices[i].push_token);
    }
}

function pushMessageToWpCallback(obj) {
    logger.info('pushMessageToWpCallback',obj);
}

function pushMessageToWp(srcUser,dstUser,devices,msg,payload,pushType) {
    if (!_.isArray(devices) || devices.length==0) return;

    for(var i in devices) {
        var msg = {
            text1: srcUser ? srcUser.info.userName:msg.title,
            text2: msg.text,
            param: "/MainPage.xaml?payload="+encodeURIComponent(JSON.stringify(payload))
        };

        logger.info('send message to microsoft');
        logger.info('device '+devices[i].push_token);
        logger.info('message',msg);
        microsoftPushService.sendToast(devices[i].push_token, msg, pushMessageToWpCallback);
        logger.info('done');
    }
}


function pushMessageToDevices(srcUser,dstUser,devices,msg,payload,pushType) {
    var byTypes={};

    if (!pushType) {
        pushType='chat';
    }

    logger.info('push message ',msg);

    //logger.info('to devices ',devices);
    // arrange by types
    for(var idx in devices) {
        if (!_.isString(devices[idx].push_token)) continue;
        if (devices[idx].push_token.match(/^BROWSER-PUSH-TOKEN.*/)) continue;
        if (devices[idx]['setting_notification_'+pushType]!=1) continue;

        if (!byTypes[devices[idx].type]) {
            byTypes[devices[idx].type]=[];
        }
        byTypes[devices[idx].type].push(_.clone(devices[idx]));
        logger.info('device ',devices[idx]);
    }

    pushMessageToAndroid(srcUser,dstUser,byTypes.ANDROID,msg,payload,pushType);
    pushMessageToIos(srcUser,dstUser,byTypes.IOS,msg,payload,pushType);
    pushMessageToWp(srcUser,dstUser,byTypes.WP,msg,payload,pushType);
}


function logUserSockets(user) {
    logger.info('user '+user.id+' open sockets:');
    for (var socketIdx in user.sockets) {
        var socket = sockets.connected[user.sockets[socketIdx]];
        if (socket) {
            logger.info('mobileType '+socket.messenger.mobileType+' uuid '+socket.messenger.deviceUuid);
        } else {
            logger.info('dead socket');
        }
    }
}

function deliveryToDestUser(srcUser,destUser,msg) {
    var devicesToPush=[];

    var websocketMsg={
        type: 'history',
        status: true,
        user_id: srcUser.id,
        log: [
            msg
        ]
    };

    //logger.info('deliveryToDestUser');
    //logger.info(destUser);
    //logUserSockets(destUser);
    // send message to connected mobile devices
    var sentSockets={};

    for(var deviceIdx in destUser.userDevices) {
        var sent=false;
        //logger.info("device info ",destUser.userDevices[deviceIdx]);
        //logger.info("search socket for uuid "+destUser.userDevices[deviceIdx].device_uuid);
        //logger.info(destUser.sockets);
        for (var socketIdx in destUser.sockets) {
            //logger.info('found socket 2');
            var socket = sockets.connected[destUser.sockets[socketIdx]];
            //logger.info('found socket');
            //logger.info(socket);
            if (socket && socket.messenger.mobileType==destUser.userDevices[deviceIdx].type &&
                socket.messenger.deviceUuid==destUser.userDevices[deviceIdx].device_uuid) {
                socketJsonSend(sockets.connected[destUser.sockets[socketIdx]],websocketMsg);
                sentSockets[destUser.sockets[socketIdx]]=true;
                sent=true;
                //logger.info("sent message to uuid "+socket.messenger.deviceUuid);
                mobileMessagesAwaitingDelivery[msg.id+"_"+destUser.userDevices[deviceIdx].device_uuid]={
                    srcUser: _.clone(srcUser),
                    dstUser: _.clone(destUser),
                    msg: _.clone(msg),
                    expire: (new Date()).getTime()+config.mobileMessageDeliveryTimeout,
                    userDevice: _.clone(destUser.userDevices[deviceIdx]),
                    socketId: destUser.sockets[socketIdx]
                };
                break;
            }
        }
        //logger.info('Done!');
        //logger.info("not found socket for uuid "+destUser.userDevices[deviceIdx].device_uuid+' add to push');
        if (!sent) {
            devicesToPush.push(destUser.userDevices[deviceIdx])
        }
    }

    // send to connected devices, with disabled notifications and to desktop browsers
    for (var socketIdx in destUser.sockets) {
        if (!sentSockets[destUser.sockets[socketIdx]]) {
            socketJsonSend(sockets.connected[destUser.sockets[socketIdx]],websocketMsg);
        }
    }

    // send message to unconnected mobile devices
    pushMessageToDevices(srcUser,destUser,devicesToPush,msg,{
        type:'CHAT',
        user_id:srcUser.id
    },'chat');
/*
    // send messages to desktop browsers
    for (var socketIdx in destUser.sockets) {
        socket = sockets.connected[destUser.sockets[socketIdx]];
        if (socket && !socket.messenger.mobileType) {
            socketJsonSend(sockets.connected[destUser.sockets[socketIdx]],websocketMsg);
        }
    }
*/
}


function sendToRelatedUsers(user,msg) {
    var user_ids=userRelations.getInverse(user.id);

    for(var userIdIdx in user_ids) {
        var rUser=users[user_ids[userIdIdx]];
        sendToUser(rUser,msg);
    }
}


function checkIfUserStatusChanged(user) {

    function setNewStatus(status) {
        //logger.info('checkIfUserStatusChanged old status '+user.status+' new status '+status);
        if (user.status!=status) {
            if (status == 1) setMobileStatus(user);
            if (status == 0) setOfflineStatus(user);
            if (status == 2) setOnlineStatus(user);
        }
        user.status=status;
    }

    if (!userHasBrowserSockets(user) && !user.onlineTimeoutLeft) {
        usersHasMobileStatus([user.id])
            .then(function (result) {
                setNewStatus(result[user.id] ?1:0);
            });
    } else {
        setNewStatus(2);
    }
}


function setOnlineStatus(user) {
    logger.info('set online status for user '+user.id);

    sendToRelatedUsers(user,{type:'updateUsersInfo',status:true,users:[{id:user.id,status:2}]});

    db.query('update chat_user set online=1,online_mobile=0 where user_id='+user.id,dbErrorHandler);
}


function setMobileStatus(user) {
    sendToRelatedUsers(user,{type:'updateUsersInfo',status:true,users:[{id:user.id,status:1}]});

    logger.info('set mobile status for user '+user.id);
    db.query('update chat_user set online=0,online_mobile=1 where user_id='+user.id,dbErrorHandler);
}


function setOfflineStatus(user) {
    sendToRelatedUsers(user,{type:'updateUsersInfo',status:true,users:[{id:user.id,status:0}]});

    logger.info('set offline status for user '+user.id);
    db.query('update chat_user set online=0,online_mobile=0 where user_id='+user.id,dbErrorHandler);
}


function cleanupUsersOnlineStatus() {
    logger.info('cleanup users online status');
    db.query('update chat_user set online=0 where online=1',dbErrorHandler);
    db.query('update chat_user set online_mobile=0 where online_mobile=1',dbErrorHandler);
}


cleanupUsersOnlineStatus();


function getUserBySocket(socket) {
    return users[socket.messenger.user_id];
}


function getProtectedId(id)
{
    if (!id) {
        return null;
    }

    var hash=crypto.createHash('sha1').update(id+global.config.chatFileIdProtectionCode).digest('hex');

    return id+hash;
}


function getIdFromProtected(protectedId)
{
    protectedId=String(protectedId);
    if (protectedId=='') return null;

    var id=protectedId.substr(0, protectedId.length-40);
    if (getProtectedId(id)!==protectedId) {
        return null;
    }

    return id;
}


function getFrontFileInfo(fileInfo) {
    if (!fileInfo) return null;

    return {
        id: getProtectedId(fileInfo.chat_file_id),
        url:global.config.chatFileUrl+fileInfo.link,
        ext:fileInfo.ext,
        size:fileInfo.size,
        name:fileInfo.name,
        thumbUrl:getFileThumbUrl(fileInfo.link)
    };
}


global.chat.updateInitInfo=function(userIds) {
    for(var idx in userIds) {
        var userId=userIds[idx];
        if (users[userId]) {
            for(var socketIdx in users[userId].sockets) {
                sendInitInfo(users[userId],sockets.connected[users[userId].sockets[socketIdx]]);
            }
        }
    }
};

global.chat.getUserInfo=function(userId) {
    return Q.Promise(function (resolve, reject, notify){
        getUsersInfo([+userId]).then(function(val){
            resolve(val[+userId]);
        })
    });
};

global.chat.sendStatusUpdate=function(userIds,options) {
    for(var idx in userIds) {
        sendToUser(users[userIds[idx]], {
            type: 'statusUpdate',
            status: true,
            options: options
        });
    }
};

global.chat.pushMessageSendExt=function(data) {
    logger.info('pushMessageSendExt rpc call received');
    dbQuery('select * from user_device where user_id in (?) and setting_notification_all=1',
        [data.user_ids]
    ).then(function(result) {
        var idx;

        for (idx in data.user_ids) {
            var user_id=data.user_ids[idx];

            if (!users[user_id]) {
                users[user_id]={
                    id:user_id,
                    sockets:[],
                    status:0,
                    userDevices:[]
                }
            } else {
                users[user_id].userDevices=[];
            }
        }

        var devicesToPush=[];

        for(idx in result) {
            users[+result[idx].user_id].userDevices.push(result[idx]);
            devicesToPush.push(result[idx]);
        }

        var msg={
            text: data.text,
            title: data.title
        };
        logger.info('send to '+devicesToPush.length+' devices');

        // send message to mobile devices
        pushMessageToDevices(null,null,devicesToPush,msg,{
            type:data.type,
            link:data.link,
        },data.type);
    });
};

global.chat.newEvent=function(data) {
    logger.info('newEvent rpc call received');
    dbQuery('select * from user_device where user_id in (?) and setting_notification_all=1',
        [data.user_ids]
    ).then(function(result) {
            var idx;

            for (idx in data.user_ids) {
                var user_id=data.user_ids[idx];

                if (!users[user_id]) {
                    users[user_id]={
                        id:user_id,
                        sockets:[],
                        status:0,
                        userDevices:[]
                    }
                } else {
                    users[user_id].userDevices=[];
                }
            }

            var devicesToPush=[];

            for(idx in result) {
                users[+result[idx].user_id].userDevices.push(result[idx]);
                devicesToPush.push(result[idx]);
            }

            var msg={
                text: data.text,
                title: data.title
            };
            logger.info('send to '+devicesToPush.length+' devices');

            // send message to mobile devices
            pushMessageToDevices(null,null,devicesToPush,msg,{
                type:'EVENT'
            },'activity');

/*

            if (!users[data.user_id]) {
                users[data.user_id]={
                    id:data.user_id,
                    sockets:[],
                    status:0
                }
            }

            users[data.user_id].userDevices=result;

            var destUser=users[data.user_id];
            var msg={
                text: data.text,
                title: data.title
            };

            var devicesToPush=[];

            for(var deviceIdx in destUser.userDevices) {
                var online=false;
                //logger.info("device info ",destUser.userDevices[deviceIdx]);
                //logger.info("search socket for uuid "+destUser.userDevices[deviceIdx].device_uuid);
                for (var socketIdx in destUser.sockets) {
                    var socket = sockets.connected[destUser.sockets[socketIdx]];
                    if (socket && socket.messenger.mobileType==destUser.userDevices[deviceIdx].type &&
                        socket.messenger.deviceUuid==destUser.userDevices[deviceIdx].device_uuid) {
                        online=true;
                        break;
                    }
                }
                //logger.info("not found socket for uuid "+destUser.userDevices[deviceIdx].device_uuid+' add to push');
                if (!online) {
                    devicesToPush.push(destUser.userDevices[deviceIdx])
                }
            }

            logger.info('pushing to devices',devicesToPush);
            // send message to unconnected mobile devices
            pushMessageToDevices(null,destUser,devicesToPush,msg,{
                type:'EVENT'
            });
*/
    });
};

global.chat.pushMessageSend=function(data) {
    logger.info('pushMessageSend rpc call received');
    dbQuery('select * from user_device where user_id=? and setting_notification_all=1',
        [data.user_id]
    ).then(function(result) {
            if (!users[data.user_id]) {
                users[data.user_id]={
                    id:data.user_id,
                    sockets:[],
                    status:0
                }
            }

            users[data.user_id].userDevices=result;

            var destUser=users[data.user_id];
            var msg={
                text: data.text,
                title: data.title,
                sound: data.sound
            };

            var devicesToPush=[];

            for(var deviceIdx in destUser.userDevices) {
                var online=false;
                //logger.info("device info ",destUser.userDevices[deviceIdx]);
                //logger.info("search socket for uuid "+destUser.userDevices[deviceIdx].device_uuid);

                /*
                for (var socketIdx in destUser.sockets) {
                    var socket = sockets.connected[destUser.sockets[socketIdx]];
                    if (socket && socket.messenger.mobileType==destUser.userDevices[deviceIdx].type &&
                        socket.messenger.deviceUuid==destUser.userDevices[deviceIdx].device_uuid) {
                        online=true;
                        break;
                    }
                }
                */
                
                //logger.info("not found socket for uuid "+destUser.userDevices[deviceIdx].device_uuid+' add to push');
                if (!online) {
                    devicesToPush.push(destUser.userDevices[deviceIdx])
                }
            }

            //logger.info('pushing to devices',devicesToPush);
            // send message to unconnected mobile devices
            pushMessageToDevices(null,destUser,devicesToPush,msg,{
                type:'PUSH',
                link:data.link,
                push_type: data.type
            },data.type);

        });
};

global.chat.sendMessage=function(fromUserId,msg) {
    var user;
    if (users[fromUserId]) {
        user= _.clone(users[fromUserId]);
    } else {
        user={
            id: fromUserId,
            sockets: [],
            status:0
        };
    }

    getUsersInfo([fromUserId]).then(function(res) {
        user.info=res[fromUserId];
        sendMessage(user,null,msg,false);
    });
};

global.chat.broadcast=function(message) {
    for(var userIdx in users) {
        for(var socketIdx in users[userIdx].sockets) {
            var socketId=users[userIdx].sockets[socketIdx];
            if (sockets.connected[socketId]) {
                socketJsonSend(sockets.connected[socketId],message);
            }
        }
    }
};

global.chat.sendSystemMessageToChat=function(fromUserId,msg) {
    var user;
    if (users[fromUserId]) {
        user= _.clone(users[fromUserId]);
    } else {
        user={
            id: fromUserId,
            sockets: [],
            status:0
        };
    }

    getUsersInfo([fromUserId]).then(function(res) {
        user.info=res[fromUserId];
        sendMessage(user,null,msg,true);
    });
};

function resolvedPromise() {
    return Q.Promise(function (resolve, reject, notify) {
        resolve(true);
    });
}

function sendMessage(user,socket,msg,typeIsSystem) {
    logger.info('send message from user '+user.id+' to user '+msg.user_id);

    //var dtObj=msg.dt ? new Date(msg.dt):new Date();
    var dtObj=new Date();
    var dt=dtObj.toISOString();

    var destinationIsGroupChat=false;
    var msgUserInfo={};
    var recipients=[msg.user_id];

    // cast to string
    msg.user_id=""+msg.user_id;

    dbQuery('select * from chat_user where user_id=?',
        [msg.user_id]
    ).then(function(result) {
        return Q.Promise(function (resolve, reject, notify) {
            if (result.length > 0 && result[0].is_group_chat=="1") {
                msgUserInfo=result[0];
                destinationIsGroupChat = true;
                dbQuery('update chat_user set group_chat_messages_count=group_chat_messages_count+1 where user_id=?',[msg.user_id]);

                dbQuery('select user_id from chat_user_contact where second_user_id=? and user_id!=?',
                    [msg.user_id, user.id])
                    .then(function (result) {
                        //recipients=[0];
                        for (var idx in result) {
                            recipients.push(result[idx].user_id);
                        }
                        resolve(true);
                    })
            } else {
                resolve(true);
            }
        });
    }).then(function(data) {
       return dbQuery('select * from chat_user_ignore where user_id=? and ignore_user_id=?',
           [msg.user_id,user.id]
       );
    }).then(function(data) {
            if (data.length>0) {
                sendInitInfo(user,socket);
                return;
            }
            if (/*(!fromRpc && userRelations.getDirect(user.id).indexOf(msg.user_id)==-1) ||*/
                ['TEXT','IMAGE','VIDEO','GEOLOCATION','AUDIO','CONTACT'].indexOf(msg.content_type)==-1) {
                logger.info('message validation failed');
                return;
            }

            switch(msg.content_type) {
                case 'IMAGE':
                    msg.text='Bild';
                    break;
                case 'VIDEO':
                    msg.text='Video';
                    break;
                case 'GEOLOCATION':
                    msg.text='Geolocation';
                    break;
                case 'AUDIO':
                    msg.text='Audio';
                    break;
                case 'CONTACT':
                    msg.text='Contact';
                    break;
                default:
            }

            var chat_file_id=getIdFromProtected(msg.chat_file_id);
            var chat_file_make_copy=msg.chat_file_make_copy;

            var sourceUserMsgId;
            var destUserMsgId;
            var fileInfo;

            var pDestUserDevices=dbQuery('select * from user_device where user_id in (?) and setting_notification_all=1',
                [recipients]
            );

            var pChatUserContact=dbQuery('insert into chat_user_contact(user_id,second_user_id,decision_needed) values (?,?,0),(?,?,1) on duplicate key update user_id=user_id',
                [user.id,msg.user_id,msg.user_id,user.id]);

            dbQuery('insert into chat_message (dt, user_id, second_user_id, sender_user_id, type, content_type, text, extra) values (?, ?, ?, ?, ?, ?, ?, ?)',
                [dtObj,user.id,msg.user_id,destinationIsGroupChat ? user.id:null,typeIsSystem ? 'SYSTEM':'OUTGOING_UNDELIVERED',msg.content_type,msg.text,msg.extra]
            ).then(function(result){
                    sourceUserMsgId=result.insertId;
                    var pDestinationUser=dbQuery('insert into chat_message (dt,user_id,second_user_id,sender_user_id,outgoing_chat_message_id,type,content_type,text,extra) select ?,cu.user_id,?,?,?,?,?,?,? from chat_user cu where cu.user_id in (?)',
                        [dtObj,destinationIsGroupChat ? msgUserInfo.user_id:user.id,destinationIsGroupChat ? user.id:null,typeIsSystem ? null:sourceUserMsgId,typeIsSystem ? 'SYSTEM':'INCOMING_UNDELIVERED',msg.content_type,msg.text,msg.extra,recipients]
                    ).then(function(result){
                            destUserMsgId=result.insertId;
                            var pDestConversation=dbQuery('insert into chat_conversation(user_id,second_user_id,last_chat_message_id) select cu.user_id,?,? from chat_user cu where cu.user_id in (?) on duplicate key update last_chat_message_id=?',
                                [destinationIsGroupChat ? msgUserInfo.user_id:user.id,result.insertId,recipients,result.insertId]
                            );

                            var promises=[pDestConversation];
                            if (chat_file_id) {
                                var pChatFileDest = dbQuery('select *,id as chat_file_id from chat_file where id=?', [chat_file_id]).then(function (result) {
                                    var row = result[0];
                                    fileInfo= _.clone(row);

                                    var promises2=[];

                                    promises2.push(
                                        dbQuery('insert into chat_file(dt,user_id,chat_message_id,link,size,name,ext) select ?,user_id,id,?,?,?,? from chat_message where outgoing_chat_message_id=?', [
                                            row['dt'], row['link'], row['size'], row['name'], row['ext'], sourceUserMsgId
                                        ])
                                    );

                                    if (chat_file_make_copy) {
                                        promises2.push(
                                            dbQuery('insert into chat_file(dt,user_id,chat_message_id,link,size,name,ext) values(?,?,?,?,?,?,?)', [
                                                row['dt'], user.id, sourceUserMsgId, row['link'], row['size'], row['name'], row['ext']
                                            ])
                                        );
                                    };

                                    return Q.all(promises2);
                                });

                                promises.push(pChatFileDest);
                            }

                            return Q.all(promises);
                        });

                    var pSourceUserMsg=dbQuery('insert into chat_conversation(user_id,second_user_id,last_chat_message_id) values (?,?,?) on duplicate key update last_chat_message_id=?',
                        [user.id,msg.user_id,result.insertId,result.insertId]
                    );

                    var promises=[pDestUserDevices,pDestinationUser,pSourceUserMsg,pChatUserContact];

                    if (chat_file_id && !chat_file_make_copy) {
                        var pChatFileSrc=dbQuery('update chat_file set chat_message_id=? where id=?', [sourceUserMsgId,chat_file_id]);

                        promises.push(pChatFileSrc);
                    }

                    return Q.all(promises);
                })
                .then(function(result) {
                    if (!users[msg.user_id]) {
                        users[msg.user_id]={
                            id:msg.user_id,
                            sockets:[],
                            status:0
                        }
                    }

                    users[msg.user_id].userDevices=result[0];

                    var messageFeedback= {
                        id: sourceUserMsgId,
                        dt: dt,
                        type: typeIsSystem ? 'SYSTEM':'OUTGOING_UNDELIVERED',
                        content_type: msg.content_type,
                        text: msg.text,
                        extra: msg.extra,
                        file:getFrontFileInfo(fileInfo)
                    };

                    if (socket) {
                        socketJsonSend(socket,{type: 'sendMessageAck', status: true, uuid: msg.uuid, message: messageFeedback});
                    }

                    sendToUser(user,{
                        type: 'history',
                        status: true,
                        user_id: msg.user_id,
                        log: [messageFeedback]
                    });

                    var sendDestPromise;

                    if (destinationIsGroupChat) {
                        sendDestPromise=getUsersInfo([user.id]);
                    } else {
                        sendDestPromise=resolvedPromise();
                    }
                    sendDestPromise.then(function(usersInfo) {
                        dbQuery('select id,user_id from chat_message where outgoing_chat_message_id=? or id=?',[sourceUserMsgId,destUserMsgId]).then(function(result){
                            for(var i in result) {
                                if (users[result[i].user_id]) {
                                    var destMsg= {
                                        id: result[i].id,
                                        dt: dt,
                                        type: typeIsSystem ? 'SYSTEM':'INCOMING_UNDELIVERED',
                                        content_type: msg.content_type,
                                        text: msg.text,
                                        extra: msg.extra,
                                        file:getFrontFileInfo(fileInfo)
                                    };

                                    if (destinationIsGroupChat) {
                                        destMsg.user=usersInfo[user.id];
                                    }

                                    if (result[i].user_id>0) {
                                        deliveryToDestUser(destinationIsGroupChat ? {
                                            id: msgUserInfo.user_id,
                                            first_name: msgUserInfo.first_name,
                                            last_name: ''
                                        } : user, users[result[i].user_id], destMsg);
                                    }
                                }
                            }
                        });
                    });

                }).fail(function (error) {
                    if (socket) {
                        socketJsonSend(socket,{type: 'sendMessageAck', status: String(error), uuid: msg.uuid});
                    }

                    logError(error);
                });
    });
}


function logError(error) {
    logger.error(String(error));
}


function getHistory(user,socket,msg) {

    // update moderator group chat last time visit
    if (msg.user_id<0 && !msg.max_message_id) {
        dbQuery('insert into group_chat_moderator_last_visit (group_chat_id,moderator_user_id,dt) (' +
            'select ?,id,NOW() from user where user.id=? and user.is_moderator=1) on duplicate key update dt=NOW()', [msg.user_id, user.id]);
    }

    dbQuery('select chat_message.id, chat_message.dt, chat_message.sender_user_id, chat_message.type, chat_message.content_type, ' +
            'chat_message.text, chat_message.extra, IF(chat_user_ignore.user_id,1,0) as user_is_blocked_in_this_chat,' +
            'chat_file.link, chat_file.name, chat_file.ext, chat_file.size, chat_file.id as chat_file_id, chat_message.deleted ' +
            'from chat_message ' +
            'left outer join chat_file on (chat_file.chat_message_id=chat_message.id) ' +
            'left outer join chat_user_ignore on (chat_user_ignore.user_id=? and chat_user_ignore.ignore_user_id=chat_message.sender_user_id) '+
            'where deleted in ('+(user.info.is_moderator ? '0,2':'0')+') and chat_message.user_id=? and chat_message.second_user_id=? '+(msg.max_message_id ?' and chat_message.id<?':'')+
            ' order by chat_message.id desc limit 0,50',
            [msg.user_id,user.id,msg.user_id,msg.max_message_id]
    ).then(function(result){
        var minId=result.length>0 ? result[result.length-1].id:null;
        dbQuery('select chat_message.id, chat_message.deleted from chat_message '+
                'where deleted in ('+(user.info.is_moderator ? '1':'1,2')+') and chat_message.user_id=? and chat_message.second_user_id=? and chat_message.id>? '+
                ' order by chat_message.id desc limit 0,50',[user.id,msg.user_id,minId]
        ).then(function(result2) {
            var resultIdx;

            var usersIdsMap={};
            for(resultIdx in result) {
                if (result[resultIdx].sender_user_id) {
                    usersIdsMap[result[resultIdx].sender_user_id]=true;
                }
            }

            var usersIds=[];
            for(var userId in usersIdsMap) {
                usersIds.push(userId);
            }

            var gotUserInfoPromise;

            if (usersIds.length>0) {
                gotUserInfoPromise=getUsersInfo(usersIds);
            } else {
                gotUserInfoPromise=resolvedPromise();
            }

            gotUserInfoPromise.then(function(usersInfo) {
                var response={
                    type: 'getHistoryResponse',
                    status: true,
                    user_id: msg.user_id,
                    log: []
                };

                if (msg.max_message_id) {
                    response.max_message_id=msg.max_message_id;
                }

                for(resultIdx in result) {
                    if (result[resultIdx].deleted) {
                        result[resultIdx].visible_only_for_moderator=1;
                    }
                    delete result[resultIdx].deleted;

                    if (result[resultIdx].sender_user_id) {
                        result[resultIdx].user=usersInfo[result[resultIdx].sender_user_id];
                        result[resultIdx].user.is_blocked_in_this_chat=result[resultIdx].user_is_blocked_in_this_chat;
                        delete result[resultIdx].user_is_blocked_in_this_chat;
                        delete result[resultIdx].sender_user_id
                    }

                    if (result[resultIdx].link) {
                        result[resultIdx].file = getFrontFileInfo(result[resultIdx]);
                        delete result[resultIdx].link;
                        delete result[resultIdx].name;
                        delete result[resultIdx].ext;
                        delete result[resultIdx].size;
                    }
                    response.log.push(result[resultIdx]);
                }

                for(resultIdx in result2) {
                    response.log.push(result2[resultIdx]);
                }

                socketJsonSend(socket,response);
            });
        });
    }).fail(function (error) {
            //socketJsonSend(socket,{type:'sendMessageAck',status:String(error),uuid:msg.uuid});
            logError(error);
    });
}


function markMessagesAsDelivered(user) {
    logger.info('mark messages to user '+user.id+' as delivered');

    var incomingMessageIds=[];
    var outgoingMessageIds=[];
    var outgoingUserIds={};

    dbQuery('select id,COALESCE(sender_user_id,second_user_id) as second_user_id,outgoing_chat_message_id from chat_message where user_id=? and type=?',
        [user.id,'INCOMING_UNDELIVERED']
    ).then(function(result) {
            for(var i in result) {
                outgoingMessageIds.push(result[i].outgoing_chat_message_id);
                incomingMessageIds.push(result[i].id);
                outgoingUserIds[result[i].second_user_id]=true;
            }

            return Q.all([
                dbQuery('update chat_message set type=? where type=? and id in (?)',
                    ['INCOMING_UNREADED', 'INCOMING_UNDELIVERED', incomingMessageIds.length>0 ? incomingMessageIds:[0]]
                ),
                dbQuery('update chat_message set type=? where type=? and id in (?)',
                    ['OUTGOING_UNREADED', 'OUTGOING_UNDELIVERED', outgoingMessageIds.length>0 ? outgoingMessageIds:[0]]
                )
            ]);
        }).then(function () {
            var outgoingMessages=[];
            for(var oIdx in outgoingMessageIds) {
                outgoingMessages.push({
                    id:outgoingMessageIds[oIdx],
                    type:'OUTGOING_UNREADED'
                });
            }

            for(var outgoingUserId in outgoingUserIds) {
                sendToUser(users[outgoingUserId], {
                    type: 'updateMessageInfo',
                    status: true,
                    messages: outgoingMessages
                });
            }

            var incomingMessages=[];
            for(var iIdx in incomingMessageIds) {
                incomingMessages.push({
                    id:incomingMessageIds[iIdx],
                    type:'INCOMING_UNREADED'
                });
            }

            sendToUser(user,{
                type: 'updateMessageInfo',
                status: true,
                messages: incomingMessages
            });
        });
}


function markMessagesAsReaded(user,msg) {
    logger.info('got markMessagesAsReaded for user '+user.id+' ',msg);

    var outgoingMessageIds=[];
    var outgoingUserId=null;

    dbQuery('select COALESCE(sender_user_id,second_user_id) as second_user_id,outgoing_chat_message_id from chat_message where user_id=? and type=? and id in (?)',
        [user.id,'INCOMING_UNREADED',msg.message_id]
    ).then(function(result) {
            for(var i in result) {
                outgoingMessageIds.push(result[i].outgoing_chat_message_id);
                outgoingUserId=result[i].second_user_id;
            }

            return Q.all([
                dbQuery('update chat_message set type=? where user_id=? and type=? and id in (?)',
                    ['INCOMING_READED', user.id, 'INCOMING_UNREADED', msg.message_id]
                ),
                dbQuery('update chat_message set type=? where type=? and id in (?)',
                    ['OUTGOING_READED', 'OUTGOING_UNREADED', outgoingMessageIds.length>0 ? outgoingMessageIds:[0]]
                )
            ]);
    }).then(function () {
        var outgoingMessages=[];
        for(var oIdx in outgoingMessageIds) {
           outgoingMessages.push({
               id:outgoingMessageIds[oIdx],
               type:'OUTGOING_READED'
           });
        }

        sendToUser(users[outgoingUserId],{
            type: 'updateMessageInfo',
            status: true,
            messages: outgoingMessages
        });

        var incomingMessages=[];
        for(var iIdx in msg.message_id) {
           incomingMessages.push({
               id:msg.message_id[iIdx],
               type:'INCOMING_READED'
           });
        }

        sendToUser(user,{
           type: 'updateMessageInfo',
           status: true,
           messages: incomingMessages
        });

        dbQuery('select second_user_id as user_id,count(*) as cnt from chat_message where (type=? or type=?) and second_user_id is not null and user_id=? and deleted=0 group by second_user_id',
            ['INCOMING_UNREADED','INCOMING_UNDELIVERED', user.id]
        ).then(function (data) {
            var conversations = [];
            for (dataIdx in data) {
                conversations.push({user_id: data[dataIdx].user_id, unreaded_messages: data[dataIdx].cnt});
            }

            var updateMessage = {
                type: 'updateConversationsInfo',
                status: true,
                conversations: conversations,
                flags: {setOthersUnreadedMessagesToZero: true}
            };
            sendToUser(user, updateMessage);
        })
    });
}

function fixConversationLastMessage(user_id,second_user_id) {
    return Q.Promise(function (resolve, reject, notify) {
        dbQuery("select chat_message.* from chat_conversation join chat_message on (chat_message.id=chat_conversation.last_chat_message_id) where chat_conversation.user_id=? and chat_conversation.second_user_id=?",[user_id,second_user_id]).then(function(result){
            if (result.length==0 || result[0].deleted==0) resolve(true);

            return dbQuery("select id from chat_message where user_id=? and second_user_id=? and deleted=0 order by id desc limit 1",[user_id,second_user_id])
        }).then(function(result){
            if (result.length==0) {
                return dbQuery("delete from chat_conversation where user_id=? and second_user_id=?",[user_id,second_user_id]);
            } else {
                return dbQuery("update chat_conversation set last_chat_message_id=? where user_id=? and second_user_id=?",[result[0].id,user_id,second_user_id]);
            }
        }).then(function(result){
            resolve(true);
        }).fail(function(error) {
            resolve(true);
            logError(error);
        });
    });
}

function deleteMessageFromDestinationUser(user,user_id,outgoing_message_id) {
    logger.info('delete message '+outgoing_message_id+' for user '+user.id+' from destination user '+user_id);

    var pDestUserDevices=dbQuery('select * from user_device where user_id=? and setting_notification_all=1',
        [user_id]
    );

    var incomingMessage=null;

    dbQuery('select * from chat_message where outgoing_chat_message_id=?',
        [outgoing_message_id]
    ).then(function(result) {
            incomingMessage=result[0];

            var pUpdate=dbQuery('update chat_message set deleted=1 where id=?',
                [result[0].id]
            );

            return Q.all([pDestUserDevices,pUpdate])
        }
    ).then(function(destUserDevices) {

            fixConversationLastMessage(user_id,user.id).then(function(){
                if (!users[user_id]) {
                    users[user_id]={
                        id:user_id,
                        sockets:[],
                        status:0
                    }
                }

                users[user_id].userDevices=destUserDevices[0];

                var destMsg= {
                    id: incomingMessage.id,
                    dt: incomingMessage.dt,
                    type: 'INCOMING_READED',
                    content_type: 'TEXT',
                    text: 'Die Nachricht wurde vom Versender zurückgezogen!',
                    deleted: 1
                };

                logger.info('SEND DELETE from '+user.id+' to '+users[user_id].id);
                deliveryToDestUser(user,users[user_id],destMsg);

                global.chat.updateInitInfo([user_id]);
            });
        }
    );
}

function deleteMessage(user,socket,msg) {
    logger.info('delete message '+msg.message_id+' for user '+user.id);

    var secondUserId=null;

    dbQuery('select id,type,user_id,second_user_id,outgoing_chat_message_id from chat_message where id=?',
        [msg.message_id]
    ).then(function(result) {
            if (result.length!=1 || result[0].user_id!=user.id) {
                logger.info("message doesn't belongs to this user");
                return;
            }
            secondUserId=+result[0].second_user_id;

            if (result[0].type=='OUTGOING_UNDELIVERED' || result[0].type=='OUTGOING_UNREADED') {
                deleteMessageFromDestinationUser(user,secondUserId, msg.message_id);
            }

            return dbQuery('update chat_message set deleted=1 where id=?',
                [msg.message_id]
            );
    }).then(function(){
            return fixConversationLastMessage(user.id,secondUserId);
    }).then(function(){
            sendToUser(user,{
                type: 'history',
                status: true,
                user_id: secondUserId,
                log: [
                    {
                        id:msg.message_id,
                        deleted:1
                    }
                ]
            });
        global.chat.updateInitInfo([user.id]);
    });
}


module.exports.addSocket=function(socket, user_id, mobileType, deviceUuid) {
    socket.messenger={
        user_id: user_id,
        mobileType: mobileType,
        deviceUuid: deviceUuid
    };

    var user;
    if (users[user_id]) {
        user=users[user_id];
    } else {
        user={
            id: user_id,
            sockets: [],
            status:0
        };

        users[user_id]=user;
    }

    if (!mobileType) {
        user.onlineTimeoutLeft=null;
    }

    user.sockets.push(socket.id);
    logUserSockets(user);

    checkIfUserStatusChanged(user);

    getUsersInfo([user_id]).then(function(uInfo) {
        if (uInfo[user_id]) {
            user.info=uInfo[user_id];
            //logger.info('conn user ',user.info);
        }

        socket.on('message',function(msg) {
            if (!msg.type) return;

            logger.info('<< RECV MSG SOCKET '+socket.id+' TYPE '+msg.type);

            var user=users[socket.messenger.user_id];

            switch (msg.type) {
                case 'sendMessage':
                    sendMessage(user,socket,msg.message);
                    break;
                case 'getHistory':
                    //setTimeout(function(){
                    //    getHistory(user,socket,msg);
                    //},3000);
                    getHistory(user,socket,msg);
                    break;
                case 'getInitInfo':
                    sendInitInfo(user,socket);
                    break;
                case 'deleteMessage':
                    deleteMessage(user,socket,msg);
                    break;
                case 'markMessagesAsReaded':
                    markMessagesAsReaded(user,msg);
                    break;
                case 'messageReceivedAck':
                    messageReceivedAck(user,socket,msg);
                    markMessagesAsDelivered(user);
                    break;
            }
        });

        socket.on('disconnect',function() {
            var user=getUserBySocket(this);
            var socketIdx=user.sockets.indexOf(socket.id);
            user.sockets.splice(socketIdx,1);
            logUserSockets(user);

            var wasMobileSocket=this.messenger && this.messenger.mobileType;

            if (user.sockets.length==0) {
                userRelations.set(user.id,[]);
            }

            if (!wasMobileSocket && !userHasBrowserSockets(user)) {
                // if user don't reconnect in 15 secs, do not set status to offline
                user.onlineTimeoutLeft=15;
            }

            if (!userHasMobileSockets(user)) {
                checkIfUserStatusChanged(user);
            }

            logger.info('disconnected socket '+socket.id);
        });

        sendInitInfo(user,socket);
    });

};


function userHasBrowserSockets(user) {
    var res=false;
    for(var socketIdx in user.sockets) {
        var socket=sockets.connected[user.sockets[socketIdx]];
        if (socket && !socket.messenger.mobileType) {
            res=true;
            break;
        }
    }

    logger.info("user "+user.id+' has browser socket '+res);
    return res;
}


// set offline status for user in 60 secs after disconnection
setInterval(function(){
    for(var i in users) {
        if (users[i].onlineTimeoutLeft) {
            users[i].onlineTimeoutLeft-=5;
            if (users[i].onlineTimeoutLeft<=0) {
                users[i].onlineTimeoutLeft=null;
                checkIfUserStatusChanged(users[i]);
            }
        } else {
            users[i].onlineTimeoutLeft=null;
        }
    }
},5000);


function messageReceivedAck(user,socket,msg) {
    logger.info('receiveMessageAck '+msg.msgId);
    var mmadKey=msg.msgId+"_"+socket.messenger.deviceUuid;
    var mmad=mobileMessagesAwaitingDelivery[mmadKey];

    if (!mmad) {
        logger.info('mobileMessagesAwaitingDelivery not found');
        return;
    }

    if (!msg.resendByPush) {
        delete mobileMessagesAwaitingDelivery[mmadKey];
    } else {
        logger.info("device requested to push message");
        pushMessageToDevices(mmad.srcUser,mmad.dstUser,[mmad.userDevice],mmad.msg,{
            type:'CHAT',
            user_id:mmad.srcUser.id
        },'chat');
        delete mobileMessagesAwaitingDelivery[mmadKey];
    }
}


// check if message delivery was accepted and send message by push if fail
setInterval(function(){
    var time=(new Date()).getTime();
    for (var id in mobileMessagesAwaitingDelivery) {
        var mmad=mobileMessagesAwaitingDelivery[id];
        if (mmad.expire<=time) {
            logger.info("didn't received message receive ack from device "+mmad.userDevice.device_uuid+", pushing message");
            pushMessageToDevices(mmad.srcUser,mmad.dstUser,[mmad.userDevice],mmad.msg,undefined,'chat');
            delete mobileMessagesAwaitingDelivery[id];
        }
    }
},5000);


function getUsersStatus(userIds) {
    return Q.Promise(function (resolve, reject, notify) {
        var res={};

        dbQuery('select user_id,online,online_mobile from chat_user where user_id in (?)', [userIds])
            .then(function(result){
                for(i in result) {
                    var row=result[i];
                    res[result[i].user_id]=row.online ? 2:(row.online_mobile ? 1:0);
                    //logger.info('user '+result[i].user_id+' has status '+res[result[i].user_id]);
                }

                resolve(res);
            })
            .fail(function(error){
                logError(error);
            });
    });
}

function userHasMobileSockets(user) {
    var res=false;
    for(var socketIdx in user.sockets) {
        var socket=sockets.connected[user.sockets[socketIdx]];
        if (socket && socket.messenger.mobileType) {
            res=true;
            break;
        }
    }

    return res;
}

function usersHasMobileStatus(userIds) {
    return Q.Promise(function (resolve, reject, notify) {
        var res={};

        for(var idx in userIds) {
            var user_id=userIds[idx];
            res[user_id]=users[user_id] && userHasMobileSockets(users[user_id])
        }

        resolve(res);
    });
}

function getAvatarUrl(url,type) {
    if (!_.isString(url) || url=='') return global.config.avatarPlaceholderUrl;

    url=url.replace(/\/files\//,'files_');
    url=url.replace(/\/static\/images\//,'stimg_');

    url=encodeURIComponent(url);

    var hash=crypto.createHash('sha1').update(url).digest('hex')

    url=encodeURIComponent(url);
    url=encodeURIComponent(url);

    return global.config.avatarFileUrl+'/'+hash.slice(0,2)+'/'+url+'_'+type+'_0.jpg';
}

function getFileThumbUrl(url) {
    url=url.replace(/\/chat_files\//,'chatfiles_');

    url=encodeURIComponent(url);

    var hash=crypto.createHash('sha1').update(url).digest('hex')

    url=encodeURIComponent(url);
    url=encodeURIComponent(url);

    return global.config.chatFileThumbUrl+'/'+hash.slice(0,2)+'/'+url+'_chat_0.jpg';
}

function getUsersInfo(userIds) {
    return Q.Promise(function (resolve, reject, notify) {
        if (userIds.length == 0) {
            userIds = [0];
        }

        var pStatuses=getUsersStatus(userIds);
        var pUsersInfo=dbQuery('select cu.user_id as id,u.sex,u.nick_name,COALESCE(u.first_name,cu.group_chat_title) as first_name,u.is_company_name,u.company_name,u.last_name,u.is_moderator,u.is_blocked_in_trollbox,u.phone,cu.is_group_chat,f.link as avatar_url,u.country_id as country_id from chat_user cu left outer join user u on (u.id=cu.user_id) left outer join file f on (f.id=u.avatar_file_id) where cu.user_id in (?)', [userIds]);

        Q.spread([pStatuses,pUsersInfo],function(statuses,usersInfo) {
                var res={};

                for(var i in usersInfo) {
                    var id=usersInfo[i].id;
                    res[id]= _.clone(usersInfo[i]);
                    res[id].first_name=usersInfo[i].first_name ? usersInfo[i].first_name:'';
                    res[id].last_name=usersInfo[i].last_name ? usersInfo[i].last_name:'';

                    if (usersInfo[i].is_company_name) {
                        res[id].first_name=usersInfo[i].company_name;
                        res[id].last_name='';
                    }

                    res[id].status=statuses[id];
                    res[id].avatar_url=getAvatarUrl(usersInfo[i].avatar_url,'avatar');
                    res[id].avatar_small_url=getAvatarUrl(usersInfo[i].avatar_url,'avatarSmall');
                    res[id].avatar_mobile_url=getAvatarUrl(usersInfo[i].avatar_url,'avatarMobile');
                    res[id].country_id=usersInfo[i].country_id ? usersInfo[i].country_id:'';  
                    res[id].userName= /*_.isString(user.info.nick_name) && user.info.nick_name.length>0 ? user.info.nick_name:*/res[id].first_name+' '+res[id].last_name;
                    //logger.info('info ',user.info);
                };

                //logger.info(userIds);
                //logger.info(res);
                resolve(res);
        }).fail(function (error) {
            reject(error);
        });
    });
}

function sendInitInfo(user,socket) {
    var data={
        type: 'initInfo',
        status: true
    };

    function failed(error) {
        logger.info('initInfo failed for user '+user.id+': '+error);
        socketJsonSend(socket,{type:data.type,status:error});
    }

    var pContactsIds=dbQuery('select second_user_id,decision_needed from chat_user_contact where user_id=?', [user.id]);

    var pIgnoredIds=dbQuery('select user_id from chat_user_ignore where ignore_user_id=?', [user.id]);

    var pConversations=dbQuery(
        'delete cc from chat_conversation cc,chat_message cm '+
        'where cm.id=cc.last_chat_message_id and cm.dt<=DATE_SUB(NOW(), INTERVAL 7 DAY) and cc.user_id=? and not exists ('+
        'select id from chat_message where chat_message.user_id=cm.user_id and chat_message.second_user_id=cm.second_user_id and chat_message.type=?)',[user.id,'INCOMING_UNREADED'])
        .then(function(data) {
            return dbQuery(
                'select cc.second_user_id as conversation_user_id,cm.* from chat_conversation cc ' +
                'join chat_message cm on (cm.id=cc.last_chat_message_id) ' +
                'where cc.user_id=?',
                    [user.id]);
        });

    Q.spread([pContactsIds,pConversations,pIgnoredIds],function(contacts,conversations,ignoredIds) {
        data.users={}
        data.users[user.id]=true;

        data.friends_ids=[];
        data.decision_needed_ids=[];
        for (var i in contacts) {
            var id=contacts[i].second_user_id;

            data.friends_ids.push(id);
            data.users[id]=true;
            if (contacts[i].decision_needed) data.decision_needed_ids.push(id)
        }

        data.conversations=[];
        for (i in conversations) {
            var c={
                user_id:conversations[i].conversation_user_id,
                message:conversations[i],
                unreaded_messages: 0
            };
            delete c.message.conversation_user_id;
            data.users[c.user_id]=true;
            data.conversations.push(c);
        }

        data.ignored_ids=[];
        for(i in ignoredIds) {
            data.ignored_ids.push(ignoredIds[i].user_id);
        }

        var pUsersInfo=getUsersInfo(Object.keys(data.users));
        var pUnreadedMessages=dbQuery(
            'select second_user_id as user_id,count(*) as cnt from chat_message where (type=? or type=?) and second_user_id is not null and user_id in (?) and deleted=0 group by second_user_id',['INCOMING_UNREADED','INCOMING_UNDELIVERED',user.id]
        );

        Q.spread([pUsersInfo,pUnreadedMessages],function(usersInfo,unreadedMessages) {
            data.users=usersInfo;

            data.user=usersInfo[user.id];

            user.info=data.user;
            delete usersInfo[user.id];

            userRelations.set(user.id,Object.keys(usersInfo));

            for(var i in unreadedMessages) {
               for(var j in data.conversations) {
                   if (data.conversations[j].user_id==unreadedMessages[i].user_id) {
                       data.conversations[j].unreaded_messages=unreadedMessages[i].cnt;
                   }
               }
            }

            socketJsonSend(socket,data);
            logger.info('sent initInfo user '+user.id);
            markMessagesAsDelivered(user);
        }).fail(function(error) {
            failed(error)
        });

    }).fail(function(error) {
        failed(error)
    });
}
