var authService=angular.module('MessengerService', []);

authService.factory('messengerService',function(modal,$q,$log,$rootScope,$timeout,$interval,userNameFilter,
                                                orderByFilter,$filter,$cordovaFile,$cordovaFileTransfer,
                                                updateAuthHeaders,$cordovaActionSheet,jsonPostDataPromise,
                                                jsonDataPromise,gettextCatalog,offlineCacheService) {
    var pushToken=null;
    var chatAuthKey=null;
    var socket = null;
    var authRequestSent=false;
    var authorized=false;
    var messageFileDeferPromises = {};

    var factory={
        conversationsData: {},
        users: {},
        conversations:[],
        ignored_ids:[],
        friends_ids:[],
        appInBackground: false,
        decision_needed_ids: [],
        initialized: false,
        conversationsMediaPathCache: {}
    };

    factory.moderatorDeleteMessage=function(id) {
        modal.confirmOkCancel({
            message: gettextCatalog.getString('Willst Du wirklich diese Nachricht entfernen??'),
            title: gettextCatalog.getString('Nachrichten entfernen')
        }).then(function(buttonIndex) {
            if (buttonIndex==1) {
                jsonPostDataPromise('/ext-api-moderator/delete-message',{id:id}).then(function(data){
                    if (data.result === true) {
                        
                        for (var idx = 0; idx < factory.conversation.log.length; idx++) {
                            if (factory.conversation.log[idx].id == id) {
                                factory.conversation.log.splice(idx, 1);
                                idx--;
                            }
                        }
                        offlineCacheService.setConversationData(factory.conversation);

                    } else {
                        modal.alert(data.result);
                    }
                });
            }
        });
    };

    factory.moderatorBlockUser=function(user_id) {
        modal.confirmOkCancel({title:gettextCatalog.getString('Benutzer sperren'),message:gettextCatalog.getString('Willst Du wirklich den Benutzer für dieses Gruppenchat sperren?')}).then(function(buttonIndex) {
            if (buttonIndex!=1) return;

            jsonPostDataPromise('/ext-api-moderator/block-user',{groupChatId:factory.conversation.user_id,userId:user_id}).then(function(data){
                if (data.result===true) {
                    for (var idx = 0; idx < factory.conversation.log.length; idx++) {
                        if (factory.conversation.log[idx].user.id == user_id) {
                            var msg=angular.copy(factory.conversation.log[idx]);
                            msg.visible_only_for_moderator=1;
                            msg.user.is_blocked_in_this_chat=1;
                            factory.conversation.log[idx]=msg;
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        });
    };

    factory.moderatorUnblockUser=function(user_id) {
        modal.confirmOkCancel({title:gettextCatalog.getString('Benutzer entsperren'),message:gettextCatalog.getString('Willst Du wirklich den Benutzer für dieses Gruppenchat entsperren?')}).then(function(buttonIndex) {
            if (buttonIndex!=1) return;

            jsonPostDataPromise('/ext-api-moderator/unblock-user',{groupChatId:factory.conversation.user_id,userId:user_id}).then(function(data){
                if (data.result===true) {
                    for (var idx = 0; idx < factory.conversation.log.length; idx++) {
                        if (factory.conversation.log[idx].user.id == user_id) {
                            var msg=angular.copy(factory.conversation.log[idx]);
                            msg.user.is_blocked_in_this_chat=0;
                            factory.conversation.log[idx]=msg;
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        });
    };

    factory.moderatorBlockUserInTrollbox=function(user_id) {
        modal.confirmOkCancel({title:gettextCatalog.getString('Benutzer für alle Foren sperren'),message:gettextCatalog.getString('Willst Du wirklich den Benutzer für alle Foren sperren?')}).then(function(buttonIndex) {
            if (buttonIndex!=1) return;

            jsonPostDataPromise('/ext-api-moderator/block-user-in-trollbox',{groupChatId:factory.conversation.user_id,userId:user_id}).then(function(data){
                if (data.result===true) {
                    for (var idx = 0; idx < factory.conversation.log.length; idx++) {
                        if (factory.conversation.log[idx].user.id == user_id) {
                            var msg=angular.copy(factory.conversation.log[idx]);
                            msg.user.is_blocked_in_trollbox=1;
                            msg.user.is_blocked_in_this_chat=1;
                            factory.conversation.log[idx]=msg;
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        });
    };

    factory.moderatorUnblockUserInTrollbox=function(user_id) {
        modal.confirmOkCancel({title:gettextCatalog.getString('Benutzer für alle Foren entsperren'),message:gettextCatalog.getString('Willst Du wirklich den Benutzer für alle Foren entsperren?')}).then(function(buttonIndex) {
            if (buttonIndex!=1) return;

            jsonPostDataPromise('/ext-api-moderator/unblock-user-in-trollbox',{groupChatId:factory.conversation.user_id,userId:user_id}).then(function(data){
                if (data.result===true) {
                    for (var idx = 0; idx < factory.conversation.log.length; idx++) {
                        if (factory.conversation.log[idx].user.id == user_id) {
                            var msg=angular.copy(factory.conversation.log[idx]);
                            msg.user.is_blocked_in_trollbox=0;
                            msg.user.is_blocked_in_this_chat=0;
                            factory.conversation.log[idx]=msg;
                        }
                    }
                } else {
                    modal.alert({message:data.result});
                }
            });
        });
    };

    var uuid = (function() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
        };
    })();

    factory.preloadFile=function(message) {
        if (message.content_type!=='AUDIO' || (message.type!=='INCOMING_UNREADED' && message.type!=='INCOMING_UNDELIVERED')) return;
        $log.debug('preloading file');
        $log.debug(message);
        factory.checkAndLoadMessageFile(message);
    };

    factory.decisionAddToFriends=function() {
        jsonPostDataPromise('/ext-api-user-profile/decision-add-to-friends',{userId:factory.conversation.user_id}).then(function(){

        });
    };

    factory.decisionSkip=function() {
        jsonPostDataPromise('/ext-api-user-profile/decision-skip',{userId:factory.conversation.user_id}).then(function(){

        });
    };

    factory.decisionSpam=function() {
        $rootScope.$broadcast('spamReportPopup', {user_id:factory.conversation.user_id,okCallback:function(){
            jsonPostDataPromise('/ext-api-user-profile/decision-spam',{userId:factory.conversation.user_id}).then(function(){
                kendo.mobile.application.replace('#view-contacts');
            });
        }});
        $('#view-spam-report-popup').kendoMobileModalView('open');
    };

    factory.setPushToken=function(token) {
        $log.debug('messengerService received pushToken '+token);
        pushToken=token;
        authorize();
    };

    factory.setChatAuthKey=function(key) {
        $log.debug('messengerService received chatAuthKey '+key);
        chatAuthKey=key;
        authorize();
    };

    factory.disconnect=function() {
        if (socket) {
            /*
             socket.on('disconnect',function(){
             $log.debug('messengerService websocket disconnected');
             });
             */
            socket.disconnect();
        }
        socket=null;
        factory.initialized=false;
        for(var conversationsDataIdx in factory.conversationsData) {
            var conversationsData=factory.conversationsData[conversationsDataIdx];
            for(var messageIdx in conversationsData.log) {
                var message=conversationsData.log[messageIdx];
                if (message.sending) {
                    message.resend=true;
                }
            }
        }
    };

    factory.reconnect=function() {
        $log.debug('messengerService disconnecting websocket');
        if (socket) {
            socket.on('disconnect',function(){
                $log.debug('messengerService websocket disconnected');
                socket=null;
                factory.connect();
            });
            socket.disconnect();
            socket=null;
            factory.initialized=false;
        } else {
            factory.connect();
        }

        authRequestSent=false;
        authorized=false;
    };

    factory.logout=function() {
        factory.reconnect();
        factory.conversationsData={};
        factory.users={};
        factory.conversations=[];
        factory.ignored_ids=[];
        chatAuthKey=null;
    };

    function socketSend(msg) {
        $log.debug('messengerService sent message to websocket');
        $log.debug(msg);
        if (socket) {
            socket.json.send(msg);
            return true;
        } else {
            $log.debug('message ignored because socket is not connected or not authorized');
            return false;
        }
    }

    function authorize() {
        $log.debug('authorize');
        $log.debug(pushToken+'|'+chatAuthKey+'|'+!!socket+'|'+authRequestSent);

        // return if not all ready
        if (!pushToken || !chatAuthKey || !socket) return;
        // return if already sent authorization request
        if (authRequestSent) return;

        socketSend({type:'auth',key:chatAuthKey,'mobileType':config.extApiAuthType,'deviceUuid':config.deviceUuid,'pushToken':pushToken});
        authRequestSent=true;
    }

    function updateUnreadedMessages() {
        factory.user.unreaded_messages=0;
        factory.user.unreaded_chat_messages=0;
        factory.user.unreaded_group_chat_messages=0;

        for(var i in factory.users) {
            factory.users[i].unreaded_messages=0;
            factory.users[i].userName=userNameFilter(factory.users[i]);
        }

        //$log.debug('updateUnreadedMessages');
        //$log.debug('user '+factory.user.id);
        //$log.debug(factory.users);
        //$log.debug(factory.conversations);
        for(i in factory.conversations) {
            // this condition is hack for HTC One M9 (don't understand what is wrong)
            if (factory.users[factory.conversations[i].user_id]) {
                factory.user.unreaded_messages += factory.conversations[i].unreaded_messages;
                if (factory.conversations[i].user_id>0) {
                    factory.user.unreaded_chat_messages += factory.conversations[i].unreaded_messages;
                } else {
                    factory.user.unreaded_group_chat_messages += factory.conversations[i].unreaded_messages;
                }

                factory.users[factory.conversations[i].user_id].unreaded_messages = factory.conversations[i].unreaded_messages;
            } else {
                //$log.error('conversation user not found');
                //$log.error(factory.conversations[i]);
            }
        }

        offlineCacheService.setUsers(factory.users);
        offlineCacheService.setUser(factory.user);
        offlineCacheService.setDecisionNeededIds(factory.decision_needed_ids);
        offlineCacheService.setIgnoredIds(factory.ignored_ids);
        offlineCacheService.setFriendsIds(factory.friends_ids);
        offlineCacheService.setConversations(factory.conversations);
    }

    function generateFileName(message) {
        // Filename example: IMAGE-20150325-150.png
        return message.content_type + '-' + $filter('date')(message.dt, 'yyyyMMdd') + '-' + message.id + '.' + message.file.ext;
    }

    function getRootStorage() {
        if (isCordova()) {
            if (isAndroid()) return cordova.file.externalRootDirectory || cordova.file.dataDirectory;
            if (isWp()) return '//';
            return  cordova.file.dataDirectory;
        }
    }

    factory.getRootStorage=getRootStorage;

    factory.getConversationFiles = function(user_id, media_types, callback, error_callback, files) {
        if (angular.isUndefined(files)) {
            files = [];
        }

        if (media_types.length === 0) {
            return callback(files);
        }

        var media_type = media_types.shift();

        getConversationMediaPath(user_id, media_type)
            .then(
                function(dirEntry) {
                    var directoryReader = dirEntry.createReader();
                    directoryReader.readEntries(
                        function(entries) {
                            for (var i=0; i<entries.length; i++) {
                                if (entries[i].isDirectory) {
                                    continue;
                                }
                                entries[i].mediaType = media_type;

                                if (isWp()) {
                                    entries[i].nativeURL=entries[i].fullPath;
                                }
                                files.push(entries[i]);
                            }
                            factory.getConversationFiles(user_id, media_types, callback, error_callback, files);
                        },
                        function() {
                            error_callback(gettextCatalog.getString("Can't read " + mediaType + " media path"));
                        }
                    );
                },
                function() {
                    error_callback(gettextCatalog.getString("Can't open " + mediaType + " media path"));
                }
            );
    };

    factory.deleteMessage=function(id) {
        socketSend({
            type: 'deleteMessage',
            message_id: id
        });
    };

    function replaceDirName(name) {
        return name.replace(/[^- _,.0-9A-Za-z]+/gi, '');
    }

    function getConversationMediaPath(user_id, mediaType) {
        mediaType = angular.lowercase(mediaType);
        var root = getRootStorage();
        var path = getMediaPath(mediaType);
        var q=$q.defer();

        var defaultConversationDirectoryName = userNameFilter(factory.users[user_id]) + '  ' + user_id;
        replaceDirName(defaultConversationDirectoryName);

        // check if exist cache for this media type
        if (angular.isUndefined(factory.conversationsMediaPathCache[mediaType])) {
            factory.conversationsMediaPathCache[mediaType] = {};
        }

        if (angular.isDefined(factory.conversationsMediaPathCache[mediaType][user_id])) {
            // check conversation directory in cache
            $log.debug('get from cache');
            defaultConversationDirectoryName = factory.conversationsMediaPathCache[mediaType][user_id];
        }

        checkFilesDirectory(root + path + '/', defaultConversationDirectoryName, false,
            function(dirEntry) {
                $log.debug('exist from cache');
                q.resolve(dirEntry);
            },
            function(error) {
                $log.debug('not exist from cache');
                checkFilesDirectory(root, path, true, function(dirEntry) {
                    var directoryReader = dirEntry.createReader();
                    directoryReader.readEntries(
                        function(entries) {
                            var expr = new RegExp('  (\\d+)$');
                            for (var i=0; i<entries.length; i++) {
                                if (!entries[i].isDirectory) {
                                    continue;
                                }
                                var m = entries[i].name.match(expr);
                                if (m) {
                                    // save conversation path in cache
                                    factory.conversationsMediaPathCache[mediaType][ parseInt(m[1]) ] = entries[i].name;
                                }
                                if (m && parseInt(m[1]) == user_id) {
                                    return q.resolve(entries[i]);
                                }
                            }
                            var dirName = replaceDirName(userNameFilter(factory.users[user_id]) + '  ' + user_id);
                            createFilesDirectory(root + dirEntry.fullPath.substring(1), dirName, function(userDirEntry) {
                                factory.conversationsMediaPathCache[mediaType][user_id] = dirName;
                                q.resolve(userDirEntry);
                            });
                        },
                        function() {
                            q.reject(false);
                        }
                    );
                });
            }
        );

        return q.promise;
    }

    function getMediaPath(mediaType) {
        var ct = angular.uppercase(mediaType.charAt(0)) + angular.lowercase(mediaType.substr(1));
        var path;

        if (!isWp()) {
            path='JuglApp/Media/Jugl ' + ct + 's';
        } else {
            path='Shared/Media/'+ct+'s';
        }

        return path;
    }

    factory.retryUploadFile=function(message) {
        message.uploadFailed=false;
        message.triesLeft=3;
        startUpload(message);
    };

    function startUpload(message) {
        var headers={};

        function uploadFailed(data) {
            $log.error('file upload failed');
            $log.error(data);

            message.triesLeft--;
            if (message.triesLeft>0) {
                $timeout(function() {
                    startUpload(message);
                },5000);
                return;
            }

            message.uploadFailed=true;
            message.progress=null;
        }

        message.uploadFailed=false;
        updateAuthHeaders(headers);

        var fileName=message.uri.replace(/^.*[\\/]/,'');
        if (!fileName.match(/.*\.[a-zA-Z0-9]{3,4}$/)) {
            if (message.content_type=='IMAGE') {
                fileName=fileName+'.jpg';
            }
            if (message.content_type=='VIDEO') {
                fileName=fileName+'.mp4';
            }
        }
        $cordovaFileTransfer.upload(config.urls.chatFileUpload,message.uri,{
            headers: headers,
            // required for windows phone
            fileKey: 'file',
            fileName: fileName
        },true).then(function(data) {
            $log.debug('UPLOAD FINISHED');
            $log.debug(response);

            var response;
            try {
                if (data.responseCode!=200) {
                    throw true;
                }

                response=angular.fromJson(data.response);
            } catch (e) {
                uploadFailed();
                return;
            }

            $log.debug('file upload succeeded');
            $log.debug(data);

            if (response.id) {
                //message.uploading=false;
                message.progress='100.00%';
                message.sending=true;
                message.chat_file_id=response.id;
                factory.sendMessageToSocket(message);
            } else {
                //modal.error("file upload error: "+response.error);
                modal.error(gettextCatalog.getString('Fehler beim Hochladen der Datei.'));
            }
        },function(data) {
            uploadFailed(data);
            return;
        },function(progress) {
            //console.log(progress);
            message.progress=(progress.loaded/progress.total*100).toFixed(2)+'%';
            while (message.progress.length<7) message.progress=' '+message.progress;
            $log.debug('upload progress '+message.progress);
        });
    }

    function removeMessage(message) {
        for(var conversationsDataIdx in factory.conversationsData) {
            var conversationsData=factory.conversationsData[conversationsDataIdx];
            for(var messageIdx in conversationsData.log) {
                if (conversationsData.log[messageIdx].uuid===message.uuid) {
                    conversationsData.log.splice(messageIdx,messageIdx);
                }
            }
        }
    }

    function upload(message) {
        $log.debug("got uri for upload");
        $log.debug(message.uri);

        message.triesLeft=3;
        message.progress=' ';

        if (message.content_type=='IMAGE') {
            message.rotationClass = 'rotateHidden';
        }

        if(isAndroid()) {
            if(!message.uri.match(/file:\/\//g)) {
                message.uri = 'file://'+message.uri;
            }
        }

        //This alias is a read-only pointer to the app itself
        window.resolveLocalFileSystemURL(message.uri, function(fileEntry){
            fileEntry.file(function(file){

                    if (message.content_type=='IMAGE') {

                        var res=EXIF.getData(file, function () {
                            var Orientation = EXIF.getTag(file, "Orientation");
                            $log.debug('orientation '+Orientation);
                            var deg= 0,mirror=false;
                            switch (Orientation) {
                                case 2:
                                    mirror = true;
                                    break;
                                case 3:
                                    deg = 180;
                                    break;
                                case 4:
                                    deg = 180;
                                    mirror = true;
                                    break;
                                case 5:
                                    deg = 270;
                                    mirror = true;
                                    break;
                                case 6:
                                    deg = 270;
                                    break;
                                case 7:
                                    deg = 90;
                                    mirror = true;
                                    break;
                                case 8:
                                    deg = 90;
                                    break;
                            }

                            message.rotationClass='rotate'+deg+(mirror ? 'mirror':'');
                        });

                        if (!res) message.rotationClass='rotate0';
                    }

                    if (file.size>=50*1024*1024) {
                        removeMessage(message);
                        modal.error(gettextCatalog.getString('Die Datei darf nicht größer als 50Mb sein!'));
                        return;
                    }

                   startUpload(message);
                },
                function(){
                    removeMessage(message);
                    modal.error("can't get file size (2)");
                });
        }, function() {
            removeMessage(message);
            modal.error("can't get file size (1)");
        });
    }

    function checkFilesDirectory(base_path, path, create, callback, fail_callback) {
        if (angular.isUndefined(fail_callback)) {
            fail_callback = function(error) {};
        }
        $cordovaFile.checkDir(base_path, path)
            .then(function (success) {
                callback(success);
            }, function (error) {
                if (create) {
                    createFilesDirectory(base_path, path, callback);
                } else {
                    fail_callback(error);
                }
            });
    }

    factory.createSubfoldersIfNeeded=function(subfolder) {
        var q=$q.defer();

        var root = getRootStorage();
        var path = 'JuglApp'+subfolder;

        checkFilesDirectory(root, path, true, function() {
            q.resolve(true);
        });

        return q.promise;
    };

    function createFilesDirectory(base_path, path, callback, position) {
        position = (typeof position == 'undefined') ? 0 : position;

        var path_split = path.split('/');
        var new_position = position + 1;
        var sub_path = path_split.slice(0, new_position).join('/');

        function createDirSuccess(success) {
            if (path_split.length > new_position)
                createFilesDirectory(base_path, path, callback, new_position);
            else
                callback(success);
        }

        $cordovaFile.checkDir(base_path, sub_path)
            .then(function (success) {
                createDirSuccess(success);
            }, function (error) {
                $cordovaFile.createDir(base_path, sub_path, false)
                    .then(function(success) {
                        createDirSuccess(success);
                    });
            });
    }

    factory.recipientIgnoredMe = function() {
        if (!factory.conversation) return false;
        var ignored=factory.ignored_ids.indexOf(+factory.conversation.user_id)>=0;

        if (ignored && factory.conversation.user_id<0 && +$rootScope.status.user.is_blocked_in_trollbox>0) {
            modal.alert({message:"Du wurdest für alle Foren von einem Moderator gesperrt"});
            return ignored;
        }

        if (ignored) {
            modal.alert("Der Empfänger will derzeit keine Nachrichten empfangen");
            return ignored;
        }

        return ignored;
    };

    factory.getMessageFileInfo = function(message) {
        var q = $q.defer();

        getConversationMediaPath(factory.conversation.user_id, message.content_type)
            .then(
                function(dirEntry) {
                    var fileName = generateFileName(message);
                    var path = dirEntry.fullPath.substring(isWp() ? 2:1);
                    var targetPath = path + fileName;
                    var root = getRootStorage();
                    var info = {
                        name: fileName,
                        root: root,
                        path: path,
                        targetPath: targetPath,
                        fullPath: root + (isWp() ? targetPath:targetPath.replace(/\s/g, '%20')),
                        mimetype: ''
                    };
                    return q.resolve(info);
                },
                function() {
                    q.reject("Can't get conversation media path to save file");
                }
            );

        return q.promise;
    };

    function openFile(fileEntry) {

        if (!isWp()) {
            window.resolveLocalFileSystemURL(fileEntry.nativeURL, function(fileEntry){
                fileEntry.file(function(file){
                        var fileName=decodeURIComponent(fileEntry.nativeURL.replace('file://','file:'));

                        if (isWp()) {
                            fileName=fileEntry.nativeURL;
                        }

                        if (!isIos() && false) {
                            cordova.plugins.bridge.open(fileName,function(){
                            },function() {
                                modal.error("Can't open file");
                            });
                        } else {
                                cordova.plugins.disusered.open(fileName,function(){
                                },function() {
                                    modal.error("Can't open file");
                                });
                        }
                    },
                    function(){
                        modal.error("Can't get file info (2)");
                    });
            }, function() {
                modal.error("can't get file info (1)");
            });
        } else {
            var uri=fileEntry.fullPath;

            //uri=uri.replace(/\//g,'\\/');
            uri=uri.replace(/^\/\//,'');
            uri='ms-appdata:///local/'+uri;
            $log.debug('try to open '+uri);
/*
            cordova.InAppBrowser.open(uri, '_system');
*/
            cordova.plugins.fileOpener2.open(
                uri,
                'video/mp4',
                {
                    error : function(e) {
                        $log.error('fileOpener2: opening error: ' + e.message);
                    },
                    success : function () {
                        $log.debug('fileOpener2: file opened successfully');
                    }
                }
            );

            /*
            cordova.plugins.bridge.open(fileEntry.fullPath,function(){
            },function() {
                modal.error("Can't open file");
            });
            */
        }
    }


    factory.checkAndLoadMessageFile=function(message, successCallback) {
        if (!message.file || message.sending || message.uploading) return false;
        if (message.downloading) return false;
        if (!isCordova()) return false;

        if (message.fileEntry) {
            if (successCallback) successCallback(message.fileEntry);
            return;
        }

        message.checkingFile=true;
        factory.checkFileExist(message)
            .then(function (fileEntry) {
                $log.debug('file already exists');
                //$log.debug(message);

                message.fileEntry={
                    nativeURL:isWp() ? fileEntry.fullPath:fileEntry.nativeURL,
                    fullPath:fileEntry.fullPath
                };
                message.checkingFile=false;
                if (successCallback) successCallback(fileEntry);
            }, function (error) {
                message.checkingFile=false;
                $log.debug('start download');
                message.downloading=true;
                factory.loadFileContent(message)
                    .then(function(fileEntry) {
                        $log.debug('file downloaded successfully');
                        message.downloading=false;
                        factory.checkFileExist(message)
                            .then(function (fileEntry) {
                                message.fileEntry={
                                    nativeURL:fileEntry.nativeURL,
                                    fullPath:fileEntry.fullPath
                                };

                                // force media scanner to index file
                                if (isAndroid()) {
                                    $log.debug('mediaScanner index file '+fileEntry.nativeURL);
                                    cordova.plugins.MediaScannerPlugin.scanFile(fileEntry.nativeURL, function() {
                                        $log.debug('indexing completed successfully');
                                    },function (error) {
                                        $log.debug('indexing error:'+error);
                                    });
                                }
                                if (successCallback) successCallback(fileEntry);
                            });
                    }, function(error) {
                        $log.error('download failed');
                        message.downloading=false;
                    }, function (progress) {
                        message.progress=(progress.loaded/progress.total*100).toFixed(2)+'%';
                        //$log.debug('download progress '+message.progress);
                    });
            });
    };

    factory.showMedia=function(message) {
        if(isWp()) {
            var videoSrc = message.file.url;
            window.videoPlayer.show(videoSrc);
            factory.messageClicked(message);
        } else {
            factory.checkAndLoadMessageFile(message,function(fileEntry){
                factory.messageClicked(message);
                openFile(fileEntry);
            });
        }
    };


    factory.checkFileExist = function(message) {
        var q = $q.defer();

        factory.getMessageFileInfo(message)
            .then(
                function(info) {

                    $log.debug('checkFileExists');
                    $log.debug(info);
                    $cordovaFile.checkFile(info.root, info.targetPath).then(function(){
                        $log.debug('file exists, get size');
                        window.resolveLocalFileSystemURL(info.root+info.targetPath, function(fileEntry){
                            fileEntry.file(function(file){
                                    $log.debug('file size is '+file.size);
                                    $log.debug('message file size is '+message.file.size);
                                    if (file.size!=message.file.size) {
                                        $log.debug("sizes doesn't match, redownload");
                                        q.reject(false);
                                    } else {
                                        q.resolve(fileEntry);
                                    }
                                },
                                function(){
                                    modal.error("can't get file size (4)");
                                    q.reject();
                                });
                        }, function() {
                            modal.error("can't get file size (3)");
                            q.reject();
                        });

                    },function(error) {
                        $log.debug("file doesn't exist: "+error);
                        q.reject(error);
                    });

                },
                function(error) {
                    q.reject(error);
                }
            );

        return q.promise;
    };

    function finishFileDownloading(message) {
        if (angular.isDefined(messageFileDeferPromises[message.id]))
            delete messageFileDeferPromises[message.id];
    }

    factory.loadFileContent = function(message) {
        if (!isCordova())
            return false;

        if (!message.file) {
            return false;
        }

        if (angular.isDefined(messageFileDeferPromises[message.id]))
            return messageFileDeferPromises[message.id];

        var q = $q.defer();

        factory.getMessageFileInfo(message)
            .then(
                function(info) {
                    messageFileDeferPromises[message.id] = q.promise;
                    $cordovaFileTransfer.download(message.file.url, info.fullPath, {}, true)
                        .then(function(result) {
                            q.resolve(result);
                            finishFileDownloading(message);
                        }, function(error) {
                            q.reject(error);
                            finishFileDownloading(message);
                        }, function (progress) {
                            q.notify(progress);
                        });
                },
                function(error) {
                    q.reject(error);
                }
            );

        return q.promise;
    };

    factory.getMoreHistory=function() {
        $log.debug('messengerService: getMoreHistory requested');
        //$log.debug(!!factory.conversation);
        //$log.debug(!!factory.conversation.loadingHistory);
        //$log.debug(!!factory.conversation.hasNoMoreHistory);

        if (!factory.conversation) return;
        if (factory.conversation.loadingHistory) return;
        if (factory.conversation.hasNoMoreHistory) return;

        // find message with smallest id
        var id=null;
        for(var i in factory.conversation.log) {
            if (factory.conversation.log[i].id<id || !id) {
                id=factory.conversation.log[i].id;
            }
        }

        $log.debug('messengerService: getMoreHistory request accepted, id: '+id);

        $timeout(function(){
            if (!socketSend({type:'getHistory',user_id:factory.conversation.user_id,max_message_id:id}) || !authorized) {
                $timeout(function() {
                    factory.conversation.loadingHistory = false;
                    factory.conversation.loadingMoreHistory = false;
                });
            }
        });

        factory.conversation.loadingHistory=true;
        factory.conversation.loadingMoreHistory=true;
    };

    factory.messageClicked=function(message,forceReaded) {
        $log.debug('message clicked');
        $log.debug(message);
        if (message.type=='INCOMING_UNREADED' && (
                message.content_type=='IMAGE' || message.content_type=='VIDEO' || forceReaded
            )) {
            $log.debug('mark message as clicked');
            message.clicked=true;
            markActiveConversationMessagesAsReaded();
        }
    };

    function markActiveConversationMessagesAsReaded() {
        if (!factory.conversation || factory.appInBackground) return;
        readedIds=[];
        var unreadedImages = [];
        for(var logIdx in factory.conversation.log) {
            var msg=factory.conversation.log[logIdx];
            if (msg.type=='INCOMING_UNREADED') {
                if ((msg.content_type!='IMAGE' && msg.content_type!='VIDEO' && msg.content_type!='AUDIO') || msg.clicked) {
                    readedIds.push(msg.id);
                }
                if (msg.content_type === 'IMAGE')
                    unreadedImages.push(msg);
            }
            /*
            if (msg.content_type=='AUDIO') {
                factory.checkAndLoadMessageFile(msg);
            }
            */
        }
/*
        if (unreadedImages.length > 0) {
            for (var i = 0; i < unreadedImages.length; i++) {
                factory.loadFileContent(unreadedImages[i]);
            }
        }
*/

        if (readedIds.length>0) {
            socketSend({
                type:'markMessagesAsReaded',
                message_id:readedIds
            });
        }
    }

    $interval(markActiveConversationMessagesAsReaded,1000*5);

    function unserializeMessageExtra(msg) {
        if (angular.isString(msg.extra)) {
            msg.extra=angular.fromJson(msg.extra);
        }

        return msg;
    }

    function processMessageGetHistoryResponse(msg) {
        for(var conversationsDataIdx in factory.conversationsData) {
            var conversationsData=factory.conversationsData[conversationsDataIdx];
            if (conversationsData.user_id==msg.user_id) {

                var addedMessages=false;
                conversationsData.hasNoMoreHistory=msg.log.length===0;

                if (!msg.max_message_id && msg.log.length===0) {
                    msg.log=[];
                }

                for (var logIdx in msg.log) {
                    var found=false;

                    for(var logId in conversationsData.log) {
                        if (conversationsData.log[logId].id==msg.log[logIdx].id) {
                            if (msg.log[logIdx].deleted) {
                                conversationsData.log.splice(logId,1);
                            } else {
                                var messageUpdated=conversationsData.log[logId].type!=msg.log[logIdx].type;

                                angular.extend(conversationsData.log[logId], unserializeMessageExtra(msg.log[logIdx]));

                                // force angular to rerender message
                                if (messageUpdated) {
                                    var origMsg = conversationsData.log[logId];
                                    conversationsData.log[logId] = angular.copy(conversationsData.log[logId]);
                                    $rootScope.$apply();
                                    conversationsData.log[logId] = origMsg;
                                }

                                factory.preloadFile(conversationsData.log[logId]);
                                delete conversationsData.log[logId].fromCache;
                            }
                            found=true;
                            break;
                        }
                    }

                    if (!found && !msg.log[logIdx].deleted) {
                        addedMessages=true;
                        var msgLog=unserializeMessageExtra(msg.log[logIdx]);
                        factory.preloadFile(msgLog);
                        conversationsData.log.push(msgLog);
                    }
                }

                // ignore warning Don't make functions within a loop
                /*jshint -W083 */
                if (conversationsData.loadingMoreHistory) {
                    conversationsData.loadingHistory = false;
                    conversationsData.loadingMoreHistory=false;
                } else {
                    if (factory.conversation===conversationsData && addedMessages) {
                        //$log.debug('scroll down after getting new messages in processMessageGetHistoryResponse');
                        //$timeout(function(){
                        //    $rootScope.$broadcast('chat.scroller.scroll', true);
                        //});
                    }
                    conversationsData.loadingHistory = false;
                }
                /*jshint +W083 */

                // if we receive history from server, remove any message that was taken from cache
                for(var i=0;i<msg.log.length;) {
                    if (msg.log[logIdx].fromCache) {
                        msg.log.splice(i,1);
                    } else {
                        i++;
                    }
                }

                offlineCacheService.setConversationData(conversationsData);
            }
        }

        markActiveConversationMessagesAsReaded();
    }

    function rerenderMessage() {

    }

    function processUpdateMessageInfo(msg) {
        for(var conversationsDataIdx in factory.conversationsData) {
            var conversationsData=factory.conversationsData[conversationsDataIdx];
            for (var logIdx in conversationsData.log) {
                for(var msgIdx in msg.messages) {
                    if (msg.messages[msgIdx].id==conversationsData.log[logIdx].id) {
                        angular.extend(conversationsData.log[logIdx],unserializeMessageExtra(msg.messages[msgIdx]));
                        delete conversationsData.log[logIdx].sending;
                        delete conversationsData.log[logIdx].uuid;

                        // force chat's ngRepeat to rebuild message's html code without changing message reference
                        var origMsg=conversationsData.log[logIdx];
                        conversationsData.log[logIdx]=angular.copy(conversationsData.log[logIdx]);
                        $rootScope.$apply();
                        conversationsData.log[logIdx]=origMsg;



                        offlineCacheService.setConversationData(conversationsData);
                    }
                }
            }
        }
        markActiveConversationMessagesAsReaded();
    }

    function processMessageHistory(msg) {
        // send ack for received message
        if (msg.log.length==1 && (msg.log[0].type=='INCOMING_UNREADED' || msg.log[0].type=='INCOMING_UNDELIVERED')) {
            $rootScope.$broadcast('newIncomingMessageInChat');

            socketSend({
                type:'messageReceivedAck',
                msgId: msg.log[0].id,
                resendByPush: factory.appInBackground
            });
        }

        var found;

        var addedMessages=false;

        // add message to conversation history log
        for(var conversationsDataIdx in factory.conversationsData) {
            var conversationsData=factory.conversationsData[conversationsDataIdx];
            if (conversationsData.user_id==msg.user_id) {
                for (var logIdx in msg.log) {
                    found=false;

                    for(var logId in conversationsData.log) {
                        if (conversationsData.log[logId].id==msg.log[logIdx].id) {
                            if (msg.log[logIdx].deleted) {
                                conversationsData.log.splice(logId,1);
                            } else {
                                angular.extend(conversationsData.log[logId],unserializeMessageExtra(msg.log[logIdx]));
                                factory.preloadFile(conversationsData.log[logId]);
                                delete conversationsData.log[logId].sending;
                                delete conversationsData.log[logId].uuid;
                            }
                            found=true;
                            break;
                        }
                    }

                    if (!found && !msg.log[logIdx].deleted) {
                        addedMessages=true;
                        var msgLog=unserializeMessageExtra(msg.log[logIdx]);
                        factory.preloadFile(msgLog);
                        conversationsData.log.push(msgLog);
                    }
                }

                offlineCacheService.setConversationData(conversationsData);

                // ignore warning Don't make functions within a loop
                /*jshint -W083 */
                if (factory.conversation===conversationsData && addedMessages) {
                    //$log.debug('scroll down after getting new messages in  processMesageHistory');
                    //$timeout(function(){
                    //    $rootScope.$broadcast('chat.scroller.scroll', true);
                    //});
                }
                /*jshint +W083 */
            }
        }

        // set message as last for conversation
        if (msg.log.length>0) {
            found = false;
            for (var conversationsIdx in factory.conversations) {
                var conversation = factory.conversations[conversationsIdx];
                if (conversation.user_id == msg.user_id) {
                    found = true;
                    if (conversation.message.id<msg.log[0].id) {
                        conversation.message=msg.log[0];
                    }

                    if ((msg.log[0].type=='INCOMING_UNREADED' || msg.log[0].type=='INCOMING_UNDELIVERED') && (!factory.conversation || factory.conversation.user_id!=msg.user_id)) {
                        conversation.unreaded_messages++;
                        updateUnreadedMessages();
                    }
                }
            }
            if (!found) {
                socketSend({type:'getInitInfo'});
            }
            offlineCacheService.setConversations(factory.conversations);
        }

        markActiveConversationMessagesAsReaded();

    }

    factory.deleteContactHistory=function(userId) {
        for(var i in factory.conversations) {
            if (userId==factory.conversations[i].user_id) {
                delete factory.conversations[i];
            }
        }
        delete factory.conversationsData[userId];
        offlineCacheService.removeConversationsData(userId);
        updateUnreadedMessages();
    };

    /*
    factory.sendMessage=function() {
        if (factory.conversation.message.content_type=='TEXT' && (!factory.conversation.message.text || factory.conversation.message.text==='')) {
            return;
        }

        if (factory.conversation.message.content_type===null) return;
        factory.conversation.message.uuid=uuid();
        socketSend({
            type: 'sendMessage',
            message: {
                user_id: factory.conversation.user_id,
                content_type: factory.conversation.message.content_type,
                text: factory.conversation.message.chat_file_id ? null:factory.conversation.message.text,
                chat_file_id: factory.conversation.message.chat_file_id,
                uuid: factory.conversation.message.uuid,
                geopos_lattitude: factory.conversation.message.geopos_lattitude,
                geopos_longitude: factory.conversation.message.geopos_longitude
            }
        });
        factory.conversation.message.sending=true;

    };
    */

    factory.sendMessageToSocket=function(message) {
        if (factory.recipientIgnoredMe()) return;

            message.lastSend=Date.now();
            message.resend=
                !socketSend({
                    type: 'sendMessage',
                    message: {
                        dt: message.dt,
                        user_id: message.user_id,
                        content_type: message.content_type,
                        text: message.chat_file_id ? null:message.text,
                        chat_file_id: message.chat_file_id,
                        uuid: message.uuid,
                        extra: angular.isObject(message.extra) ? angular.toJson(message.extra):message.extra
                    }
                }) || !authorized;
    };

    factory.actionMessage=function(message) {
        $cordovaActionSheet.show({
            title: gettextCatalog.getString('Aktionen'),
            addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
            buttonLabels: [
                gettextCatalog.getString('Löschen'),
            ],
            androidEnableCancelButton: true,
            winphoneEnableCancelButton: true
        }).then(function(btnIndex) {
            switch(btnIndex) {
                case 1:
                    socketSend({
                        type: 'deleteMessage',
                        message_id: message.id
                    });
                    break;
            }
        });
    };

    factory.sendMessage2=function(message) {
        if (factory.recipientIgnoredMe()) return;

        function send() {
            message.uuid=uuid();
            message.user_id=factory.conversation.user_id;
            message.type='OUTGOING_SENDING';

            factory.conversation.log.push(message);

            if (message.uri) {
                message.uploading=true;
                upload(message);
            } else {
                message.sending=true;
                factory.sendMessageToSocket(message);
            }

            $rootScope.$broadcast('newOutgoingMessageInChat');
        }

        if (factory.systemMessage && factory.systemMessage.user_id==factory.conversation.user_id) {
            $log.debug('send system message');
            jsonPostDataPromise(factory.systemMessage.url,factory.systemMessage.params).then(function(){
                send();
            },function(){
                send();
            });
            delete factory.systemMessage;
        } else {
            send();
        }
    };

    factory.addSystemMessage=function(user_id,url,params) {
        factory.systemMessage={
            user_id:user_id,
            url:url,
            params: params
        };

        $log.debug('added system message');
        $log.debug(factory.systemMessage);
    };

    factory.closeConversation=function() {
        $log.debug('messengerService conversation closed');
        if (factory.conversation && factory.conversation.log.length>50) {
            factory.conversation.log=$filter('orderBy')(factory.conversation.log,'id').slice(factory.conversation.log.length-50);
        }
        delete factory.systemMessage;
        factory.conversation = null;
    };

    factory.getInitAndOpenChat=function(user_id) {
        socketSend({type:'getInitInfo'});
        factory.getInitAndOpenChatUserId=user_id;
    };

    factory.openConversation=function(user_id) {
        factory.getInitAndOpenChatUserId=null;

        $log.debug('messengerService conversation opening conversation for user '+user_id);

        if (!factory.conversationsData[user_id]) {
            var cachedConversationData=offlineCacheService.getConversationData(user_id);
            if (!cachedConversationData) {
                factory.conversationsData[user_id] = {
                    user_id: user_id,
                    log: [],
                    message: {},
                    loadingHistory: true,
                    hasNoMoreHistory: false,
                    loadingMoreHistory: false
                };
            } else {
                factory.conversationsData[user_id]=cachedConversationData;
                factory.conversationsData[user_id].loadingHistory=true;
            }
            // history will be requested in any case later
            //$log.debug('messengerService requesting first time history for user '+user_id);
            //socketSend({type:'getHistory',user_id:user_id});
        }

        factory.conversation=factory.conversationsData[user_id];

        factory.conversationsData[user_id].openedNewUser=false;
        if (!factory.users[user_id]) {
            jsonDataPromise('/ext-api-user-profile/open-conversation',{userId:user_id}).then(function(res){
                factory.conversationsData[res.id].user=res;
                factory.conversationsData[res.id].openedNewUser=true;
            });
        }


        angular.extend(factory.conversation,{
            hasNoMoreHistory: false,
            loadingMoreHistory: false
        });

        // update history for receiving messages that was sent when we was in background
        if (!factory.conversation.loadingHistory || true) { // force update in any case, because loadingHistory may stuck in true state
            // force preloader in any case
            factory.conversation.loadingHistory=true;
            updateCurrentConversationHistory();
        }

        //$log.debug('scroll down after opening conversation');
        //$timeout(function(){
        //    $rootScope.$broadcast('chat.scroller.scroll', true);
        //});

        markActiveConversationMessagesAsReaded();
    };

    function updateCurrentConversationHistory() {
        $log.debug('messengerService conversation update history requested');
        if (factory.conversation) {
            $log.debug('messengerService updating history for user '+factory.conversation.user_id);
            if (socketSend({type: 'getHistory', user_id: factory.conversation.user_id}) && authorized) {
                factory.conversation.loadingHistory = true;
            } else {
                factory.conversation.loadingHistory = false;
            }
        }
    }

    function resendOutgoingMessages() {
        for(var conversationsDataIdx in factory.conversationsData) {
            var conversationsData=factory.conversationsData[conversationsDataIdx];
            for(var messageIdx in conversationsData.log) {
                var message=conversationsData.log[messageIdx];
                if (message.sending && message.resend) {
                    factory.sendMessageToSocket(message);
                }
            }
        }
    }

    function bindSocketOnMessage(connectingSocket) {
        connectingSocket.on('message',function(msg) {
            // ignore messages from any old disconnected sockets
            if (socket!=connectingSocket) return;

            $log.debug('messengerService received message from websocket');
            $log.debug(msg);

            if (msg.status!==true) {
                $log.error(msg);
                return;
            }
            switch (msg.type) {
                case 'statusUpdate':
                    $rootScope.$broadcast('statusUpdateRequested');
                    break;

                case 'authResult':
                    break;

                case 'initInfo':
                    authorized=true;
                    delete msg.type;
                    delete msg.status;
                    angular.extend(factory,msg);

                    // go to contact list, if current contact is lost
                    if (factory.conversation) {
                        if (!factory.users[factory.conversation.user_id] && !factory.conversation.openedNewUser) {
                            kendo.mobile.application.navigate('#view-contacts');
                        }
                    }

                    updateCurrentConversationHistory();
                    updateUnreadedMessages();
                    if (factory.getInitAndOpenChatUserId) {
                        kendo.mobile.application.navigate('#view-chat?id=' + factory.getInitAndOpenChatUserId);
                    }
                    factory.initialized=true;
                    resendOutgoingMessages(true);
                    break;

                case 'updateUsersInfo':
                    for(var userIdx in msg.users) {
                        var user=msg.users[userIdx];
                        if (factory.users[user.id]) {
                            angular.extend(factory.users[user.id],user);
                        }
                    }

                    break;

                case 'updateConversationsInfo':
                    if (msg.flags && msg.flags.setOthersUnreadedMessagesToZero) {
                        for (var fConversation in factory.conversations) {
                            factory.conversations[fConversation].unreaded_messages=0;
                        }
                    }

                    var requestInitInfo=false;

                    for(var msgConversationIdx in msg.conversations) {
                        var found=false;
                        for(var conversationIdx in factory.conversations) {
                            if (msg.conversations[msgConversationIdx].user_id==factory.conversations[conversationIdx].user_id) {
                                angular.extend(factory.conversations[conversationIdx],msg.conversations[msgConversationIdx]);
                                found=true;
                                break;
                            }
                        }

                        if (!found) {
                            requestInitInfo=true;
                        }
                    }

                    if (requestInitInfo) {
                        socketSend({type:'getInitInfo'});
                    }

                    updateUnreadedMessages();
                    break;

                case 'updateMessageInfo':
                    processUpdateMessageInfo(msg);
                    break;

                case 'sendMessageAck':
                    for(var conversationsDataIdx in factory.conversationsData) {
                        var conversationsData=factory.conversationsData[conversationsDataIdx];
                        for(var messageIdx in conversationsData.log) {
                            if (conversationsData.log[messageIdx].uuid===msg.uuid) {
                                conversationsData.log[messageIdx] = unserializeMessageExtra(msg.message);
                            }
                        }

                        // ignore warning Don't make functions within a loop
                        /*jshint -W083 */
                        if (factory.conversation===conversationsData) {
                            //$log.debug('scroll down after receiving Ack');
                            //$timeout(function(){
                            //    $rootScope.$broadcast('chat.scroller.scroll', true);
                            //});
                        }
                        /*jshint +W083 */
                    }
                    break;

                case 'history':
                    processMessageHistory(msg);
                    break;

                case 'getHistoryResponse':
                    processMessageGetHistoryResponse(msg);
                    break;

                case 'trollboxNewMessage':
                    $rootScope.$broadcast('messengerService.trollboxNewMessage',msg);
                    break;

                default:
                    $log.error('unknown message');
                    $log.error(msg);
            }
            $rootScope.$apply();
        });
    }

    factory.connect=function() {
        if (socket) return;
        $log.debug('messengerService connecting websocket');

        var connectingSocket=io.connect(config.chatConnectUrl,{forceNew:true});

        // try to init from cache
        var users=offlineCacheService.getUsers();
        if (users) {
            factory.users=users;
        }
        var user=offlineCacheService.getUser();
        if (user) {
            factory.user=user;
        }
        var conversations=offlineCacheService.getConversations();
        if (conversations) {
            factory.conversations=conversations;
        }
        var decisionNeededIds=offlineCacheService.getDecisionNeededIds();
        if (decisionNeededIds) {
            factory.decision_needed_ids=decisionNeededIds;
        }
        var friendsIds=offlineCacheService.getFriendsIds();
        if (friendsIds) {
            factory.friends_ids=friendsIds;
        }
        var ignoredIds=offlineCacheService.getIgnoredIds();
        if (ignoredIds) {
            factory.ignored_ids=ignoredIds;
        }

        bindSocketOnMessage(connectingSocket);

        connectingSocket.on('connect',function() {
            $log.debug('messengerService successfully connected to websocket '+config.chatConnectUrl);
            socket=connectingSocket;
            authorized=false;
            authRequestSent=false;
            $rootScope.$broadcast('statusUpdateRequestedAfterConnectToWebsocket');
            authorize();
        });
    };

    factory.connect();

    var pauseTimeout=null;

    document.addEventListener("resume", function () {
        $log.debug("messengerService detected that application goes to foreground");
        if (pauseTimeout) {
            $log.debug("messengerService cancels disconnect timeout");
            $timeout.cancel(pauseTimeout);
            pauseTimeout=null;
        }
        factory.connect();
        factory.appInBackground=false;
    });

    document.addEventListener("pause", function () {
        /*
         $log.debug("messengerService detected that application goes to background, setup timeout for disconnecting");
        pauseTimeout=$timeout(function(){
            $log.debug("messengerService disconnecting timeout is over, disconnecting");
            factory.disconnect();
            pauseTimeout=null;
        },config.chatPauseTimeout);
        */
        $log.debug("messengerService detected that application goes to background, disconnecting");
        factory.disconnect();
        pauseTimeout=null;

        factory.appInBackground=true;
    });

    return factory;
});
