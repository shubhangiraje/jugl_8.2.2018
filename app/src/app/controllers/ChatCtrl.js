app.controller('ChatCtrl', function($scope,
                                    $timeout,
                                    messengerService,
                                    ChatUploader,
                                    $filter,
                                    $log,
                                    $cordovaActionSheet,
                                    $cordovaCamera,
                                    modal,
                                    $rootScope,
                                    $cordovaSpinnerDialog,
                                    $cordovaDialogs,
                                    $cordovaGeolocation,
                                    $cordovaContacts,
                                    $q,
                                    settingsService,
                                    gettextCatalog,
                                    $cordovaCapture) {
    var self = this;

    this.conversationUserInit = -1;

    $scope.chatUploader=ChatUploader(['avatarBig']);

    $scope.chatUploadOptions={
        onSuccess: function(response,status,headers) {
            $log.debug('fileupload completed successfully');
            messengerService.conversation.message.chat_file_id=response.id;
            messengerService.sendMessage();
        },
        onError:function() {
            modal.error(gettextCatalog.getString('Upload error. Please try again'));
            $log.debug('fileupload error');
        },
        onProgress:function(progress) {
            $log.debug('fileupload progress '+progress);
        }
    };

    this.sendMessage=function() {
        if (angular.isString(messengerService.conversation.message.text) && messengerService.conversation.message.text.length>0) {
            if (messengerService.recipientIgnoredMe()) return;
            messengerService.conversation.message.content_type = 'TEXT';
            messengerService.sendMessage2(angular.copy(messengerService.conversation.message));
            messengerService.conversation.message = {};
        }
    };

    var audioFile;
    var startRecording;
    var endRecording;

    this.startAudioCapture=function() {
        if (messengerService.recipientIgnoredMe()) return;
        if (audioFile) return;
        startRecording=null;
        $scope.data.isRecording=true;
        $log.debug('startAudioCapture');

        var ext='';
        var folder='';

        if (isAndroid()) {
            ext='3gp';
            folder='JuglApp/audioCapture/';
        }

        if (isIos()) {
            ext='wav';
        }

        if (isWp()) {
            folder='AudioCapture/';
            ext='wav';
        }

        var fileName= folder+'capture'+Date.now()+'.'+ext;

        var successCallback=function() {
            $log.debug('audioCapture success callback');

            var rootDir;
            if (isCordova()) {
                if (isAndroid()) {
                    rootDir=cordova.file.externalRootDirectory || cordova.file.dataDirectory;
                }
                if (isIos()) {
                    rootDir=cordova.file.tempDirectory;
                }
                if (isWp()) {
                    rootDir='/';
                }
            }

            var uri=rootDir+'/'+audioFile.src;

            function sendAudio(uri) {
                confirmSend('AUDIO').then(function () {
                    messengerService.sendMessage2({
                        uri: uri,
                        content_type: 'AUDIO',
                        extra: {duration: Math.floor((endRecording-startRecording)/1000)}
                    });
                });
            }

            if ($scope.data.visible) {
                if (isAndroid() || isWp() || isIos()) {
                    sendAudio(uri);
                }
/*
                if (isIos()) {
                    // encoding will fail if audio length is smaller than 1000ms
                    if (Date.now() - startRecording > 1000) {
                        kendo.mobile.application.showLoading();
                        window.plugins.AudioEncode.encodeAudio(uri, function (newUri) {
                            kendo.mobile.application.hideLoading();
                            sendAudio('file://' + newUri);
                        }, function () {
                            kendo.mobile.application.hideLoading();
                            modal.error('Audio file encoding failed');
                        });
                    } else {
                        sendAudio('file://' + uri);
                    }
                }
                */
            }

            $scope.data.recordStatus = false;
            if (audioFile) {
                audioFile.release();
            }
            audioFile=null;
            $scope.$apply();
        };

        var errorCallback=function(data) {
            $scope.data.recordStatus = false;

            //modal.error("error capturing audio");
            $log.error('error capturing audio');
            $log.info(data);

            audioFile=null;
            $scope.$apply();
            navigator.app.exitApp();
        };

        var progressCallback=function(status) {
            $log.debug('audio capture status '+status);
            if (status==Media.MEDIA_RUNNING) {
                $scope.data.recordStatus = true;
                startRecording = Date.now();
                if (!$scope.data.isRecording) {
                    self.endAudioCapture();
                }
            }
            $scope.$apply();
        };

        messengerService.createSubfoldersIfNeeded('/audioCapture').then(function(){
            audioFile = new Media(fileName,successCallback,errorCallback,progressCallback);
            audioFile.startRecord();
        });
    };

    this.endAudioCapture=function() {
        $scope.data.isRecording=false;
        if (audioFile && $scope.data.recordStatus && startRecording) {
            var dt=Date.now();
            var stopDelay=1000-(dt-startRecording);
            $log.debug('endAudioCapture in '+stopDelay+' ms');
            $timeout(function(){
                $log.debug('endAudioCapture');
                endRecording=Date.now();
                audioFile.stopRecord();
            },stopDelay>0 ? stopDelay:0);
        }
    };

    function sendGeolocation() {

        $cordovaSpinnerDialog.show(gettextCatalog.getString('Nachricht Verschiken'),gettextCatalog.getString('Retrieving geolocation'),true);

        $log.debug("retrieve geolocation");

        $cordovaGeolocation.getCurrentPosition({
            timeout: 60*1000,
            maximumAge: 60*1000,
            enableHighAccuracy: true
        }).then(function(position) {
            $log.debug("got geolocation");
            $log.debug(position);

            messengerService.sendMessage2({
                extra: {lattitude:position.coords.latitude,longitude:position.coords.longitude},
                content_type: 'GEOLOCATION'
            });

            $cordovaSpinnerDialog.hide();
        },function(err) {
            $cordovaSpinnerDialog.hide();
            modal.error(gettextCatalog.getString("Can't retrieve geolocation:"+' '+err.message));
            $log.error("Can't retrieve geolocation");
            $log.error(err);
        });
    }

    function confirmSend(type) {
        var messages={
            IMAGE: gettextCatalog.getString('Möchten Sie das Bild wirklich senden?'),
            VIDEO: gettextCatalog.getString('Möchten Sie das Video wirklich senden?'),
            AUDIO: gettextCatalog.getString('Möchten Sie das Audio wirklich senden?'),
            CONTACT: gettextCatalog.getString('Möchten Sie das Kontakt wirklich senden?')
        };

        var q=$q.defer();

        $cordovaDialogs.confirm(messages[type],gettextCatalog.getString('Nachricht'),[gettextCatalog.getString('Senden'),gettextCatalog.getString('Abbrechen')]).then(function(buttonIndex) {
            if (buttonIndex==1) {
                q.resolve(true);
            } else {
                q.reject(false);
            }
        });

        return q.promise;
    }

    function sendPicture(sourceType,mediaType) {

        settingsService.ignoreLogoutOnNextPause();

        // use imagePicker plugin for sending multiple photos in android and ios
        if (sourceType==Camera.PictureSourceType.PHOTOLIBRARY && mediaType==Camera.MediaType.PICTURE && !isWp()) {

            window.imagePicker.getPictures(
                function(results) {
                    if (results.length===0) return;

                    confirmSend('IMAGE').then(function(){
                        for(var idx in results) {
                            $log.debug('send picture with URI: ' + results[idx]);
                            messengerService.sendMessage2({
                                uri: results[idx],
                                content_type: 'IMAGE'
                            });
                        }
                    });
                }, function (error) {
                    $log.error('Error: ' + error);
                }, {
                    maximumImagesCount: 30,
                    width: 1280,
                    height: 1280,
                    quality: 70
                }
            );

            return;
        }

        $cordovaCamera.getPicture({
            quality: mediaType==Camera.MediaType.PICTURE ? 70:30,
            allowEdit: mediaType==Camera.MediaType.VIDEO,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: sourceType,
            encodingType: Camera.EncodingType.JPEG,
            targetWidth: mediaType==Camera.MediaType.PICTURE ? 1280:480,
            targetHeight: mediaType==Camera.MediaType.PICTURE ? 1280:480,
            saveToPhotoAlbum: false,
            mediaType: mediaType
        }).then(function(uri){
            confirmSend(mediaType==Camera.MediaType.VIDEO ? 'VIDEO':'IMAGE').then(function(){
                $log.debug(uri);
                messengerService.sendMessage2({
                    uri: uri,
                    content_type: mediaType==Camera.MediaType.VIDEO ? 'VIDEO':'IMAGE'
                });
            });
        });
    }

    function sendVideo() {

        settingsService.ignoreLogoutOnNextPause();

        if (!isWp()) {
            window.plugins.videocaptureplus.captureVideo(
                function(data) {
                    var uri=data[0].fullPath;
                    if (isIos()) {
                        uri='file://'+uri;
                    }
                    confirmSend('VIDEO').then(function() {
                        messengerService.sendMessage2({
                            uri: uri,
                            content_type: 'VIDEO'
                        });
                    });
                },
                function(err) {
                    $log.error(err);
                },
                {
                    limit: 1, // the nr of videos to record, default 1 (on iOS always 1)
                    duration: 120, // max duration in seconds, default 0, which is 'forever'
                    highquality: false, // set to true to override the default low quality setting
                    frontcamera: false // set to true to override the default backfacing camera setting. iOS: works fine, Android: YMMV (#18)
                    // you'll want to sniff the useragent/device and pass the best overlay based on that.. assuming iphone here
                    //portraitOverlay: 'www/img/cameraoverlays/overlay-iPhone-portrait.png', // put the png in your www folder
                    //landscapeOverlay: 'www/img/cameraoverlays/overlay-iPhone-landscape.png', // not passing an overlay means no image is shown for the landscape orientation
                    //overlayText: 'Please rotate to landscape for the best result' // iOS only
                }
            );
        } else {
            $cordovaCapture.captureVideo({
                limit: 1,
                duration: 120,
                highquality:true
            }).then(function(uris) {
                confirmSend('VIDEO').then(function() {
                    for(var idx in uris) {
                        messengerService.sendMessage2({
                            uri: /*'//'+*/uris[idx].fullPath,
                            content_type: 'VIDEO'
                        });
                    }
                });
            }, function(err) {
            });
        }
    }

    function sendContact() {
        $cordovaContacts.pickContact().then(function(contact){
            $scope.data.dontCloseConversationThisTime=true;
            kendo.mobile.application.navigate('#view-send-contact-details');
            $rootScope.$broadcast('sendContactDetail',contact);
        });
    }

    function sendGallery() {
        if (messengerService.recipientIgnoredMe()) return;
        $cordovaActionSheet.show({
            title: gettextCatalog.getString('Senden'),
            addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
            buttonLabels: [
                gettextCatalog.getString('Bilder'),
                gettextCatalog.getString('Videos')
            ],
            androidEnableCancelButton: true,
            winphoneEnableCancelButton: true
        }).then(function(btnIndex) {
            switch(btnIndex) {
                case 1:
                    sendPicture(Camera.PictureSourceType.PHOTOLIBRARY,Camera.MediaType.PICTURE);
                    break;
                case 2:
                    sendPicture(Camera.PictureSourceType.PHOTOLIBRARY,Camera.MediaType.VIDEO);
                    break;
            }
        });
    }

    if (!$scope.data) {
        document.addEventListener("pause", function () {
            self.endAudioCapture();
        });

        $scope.data = {
            currentDate: null,
            sendBtn: 'AUDIO',
            useFileInput: !isCordova()
        };

        $scope.data.selectionStart=function(message) {
            $scope.data.selection={
                enabled: true,
                messages: {},
                count: 1
            };

            $scope.data.selection.messages[message.id]=true;
        };

        $scope.data.selectionChange=function(message) {
            if ($scope.data.selection.messages[message.id]) {
                $scope.data.selection.count--;
                delete $scope.data.selection.messages[message.id];
            } else {
                $scope.data.selection.count++;
                $scope.data.selection.messages[message.id]=true;
            }

            if ($scope.data.selection.count===0) {
                $scope.data.selection.enabled=false;
            }
        };

        $scope.data.selectionDone=function() {
            $scope.data.selection={
                enabled: false
            };
        };

        $scope.data.selectionForward=function() {
            $scope.data.dontCloseConversationThisTime=true;
            kendo.mobile.application.navigate('view-select-contact.html');
        };

        $scope.data.selectionDelete=function() {
            modal.confirmOkCancel({
                    message: gettextCatalog.getString('Möchtest Du wirklich die gewählten Nachrichten löschen?'),
                    title: gettextCatalog.getString('Nachrichten löschen')
                }).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    for(var id in $scope.data.selection.messages) {
                        messengerService.deleteMessage(id);
                    }
                    $scope.data.selectionDone();
                }
            });
        };

        $rootScope.$on('contactSelected',function(event,user) {
            $log.debug('forward to user');
            $log.debug(user);
            if (!$scope.data.selection.enabled) return;

            var messages = [];
            var idx;
            for (idx in messengerService.conversation.log) {
                var message = messengerService.conversation.log[idx];
                if ($scope.data.selection.messages[message.id]) {
                    messages.push(angular.copy(message));
                }
            }
            $log.debug('messages');
            $log.debug(messages);

            messages = $filter('orderBy')(messages, ['dt', 'id']);

            $log.debug('sorted messages');
            $log.debug(messages);

            $scope.data.selectionDone();

            self.isForwardingMessages = true;
            kendo.mobile.application.navigate("#:back");

            $timeout(function () {
                messengerService.openConversation(user.id, true);

                for (idx in messages) {
                    if (messages[idx].file) {
                        messages[idx].chat_file_id=messages[idx].file.id;
                        messages[idx].chat_file_make_copy=true;
                    }
                    messengerService.sendMessage2(messages[idx]);
                }
            });
        });

        $scope.data.sendContact=sendContact;

        $scope.data.importContactFromMessage=function(message) {
            if (!angular.isObject(message.extra.contact)) return;

            $cordovaDialogs.confirm(gettextCatalog.getString('Mochten Sie wirklich diese Kontakt importieren?'),gettextCatalog.getString('Kontakt'),[gettextCatalog.getString('Ok'),gettextCatalog.getString('Abbrechen')]).then(function(buttonIndex) {
                if (buttonIndex==1) {
                    var srcContact=message.extra.contact;

                    var dstContact={};

                    dstContact.displayName=srcContact.displayName || srcContact.nickname || srcContact.name.formatted;
                    dstContact.nickname=dstContact.displayName;

                    dstContact.name=new ContactName();
                    dstContact.name.formatted=srcContact.name.formatted;
                    dstContact.name.familyName=srcContact.name.familyName;
                    dstContact.name.givenName=srcContact.name.givenName;
                    dstContact.name.middleName=srcContact.name.middleName;
                    dstContact.name.honorificPrefix=srcContact.name.honorificPrefix;
                    dstContact.name.honorificSuffix=srcContact.name.honorificSuffix;

                    if (angular.isString(srcContact.birthday)) {
                        if (isIos()) {
                            if (srcContact.birthday.match(/^--.*/)) {
                                dstContact.birthday=(new Date(srcContact.birthday.replace('--','1604-'))).getTime();
                            } else {
                                dstContact.birthday=(new Date(srcContact.birthday)).getTime();
                            }
                        } else {
                            //  Doesn't work properly on android
                            //if (srcContact.birthday.match(/^--.*/)) {
                            //    dstContact.birthday=srcContact.birthday.replace('--','1980-');
                            //} else {
                            //    dstContact.birthday = srcContact.birthday;
                            //}
                        }
                    }

                    var i;

                    if (angular.isArray(srcContact.phoneNumbers) && srcContact.phoneNumbers.length>0) {
                        dstContact.phoneNumbers=[];
                        for(i in srcContact.phoneNumbers) {
                            var phoneNumber=srcContact.phoneNumbers[i];
                            dstContact.phoneNumbers.push({
                                type: phoneNumber.type,
                                value: phoneNumber.value
                            });
                        }
                    }

                    if (angular.isArray(srcContact.addresses) && srcContact.addresses.length>0) {
                        dstContact.addresses=[];
                        for(i in srcContact.addresses) {
                            var address=srcContact.addresses[i];
                            dstContact.addresses.push({
                                type: address.type,
                                formatted: address.formatted,
                                streetAddress: address.streetAddress,
                                locality: address.locality,
                                region: address.region,
                                postalCode: address.postalCode,
                                country: address.country
                            });
                        }
                    }

                    if (angular.isArray(srcContact.emails) && srcContact.emails.length>0) {
                        dstContact.emails=[];
                        for(i in srcContact.emails) {
                            var email=srcContact.emails[i];
                            dstContact.emails.push({
                                type: email.type,
                                value: email.value
                            });
                        }
                    }

                    $log.debug('importing contact');
                    $log.debug(dstContact);

                    $cordovaContacts.save(dstContact).then(
                        function(){
                            $log.debug('contact imported');
                            modal.alert({'message':gettextCatalog.getString('Kontakt wurde erfolgreich importiert')});
                        },function(){
                            modal.error({'message':gettextCatalog.getString('An error occurred while importing contact')});
                        }
                    );
                }
            });
        };

        $scope.data.messageTextChanged=function(val,apply) {
            if (typeof apply == 'undefined') {
                apply=true;
            }

            var oldSendBtn=$scope.data.sendBtn;
            $scope.data.sendBtn=angular.isString(val) && val!=='' ? 'TEXT':'AUDIO';

            if (apply && oldSendBtn!=$scope.data.sendBtn) $rootScope.$apply();
        };

        $scope.$watch('messenger.conversation.message.text',function (newValue) {
            $scope.data.messageTextChanged(newValue,false);
        });

        $scope.data.showGeoposition=function(message) {
            $scope.openUrlInBrowser('http://www.google.com/maps/place/'+message.extra.lattitude+','+message.extra.longitude);
        };

        $scope.data.sendSomething=function() {
            if (messengerService.recipientIgnoredMe()) return;
            $cordovaActionSheet.show({
                title: gettextCatalog.getString('Senden'),
                addCancelButtonWithLabel: gettextCatalog.getString('Abbrechen'),
                buttonLabels: [
                    gettextCatalog.getString('Galerie'),
                    gettextCatalog.getString('Photo Aufnehmen'),
                    gettextCatalog.getString('Video Aufnehmen'),
                    gettextCatalog.getString('Meine Geo-Position schicken'),
                    gettextCatalog.getString('Kontakt schicken')
                ],
                androidEnableCancelButton: true,
                winphoneEnableCancelButton: true
            }).then(function(btnIndex) {
                if (messengerService.recipientIgnoredMe()) return;
                switch(btnIndex) {
                    case 1:
                        sendGallery();
                        break;
                    case 2:
                        sendPicture(Camera.PictureSourceType.CAMERA,Camera.MediaType.PICTURE);
                        break;
                    case 3:
                        sendVideo();
                        break;
                    case 4:
                        sendGeolocation();
                        break;
                    case 5:
                        sendContact();
                        break;
                }
            });
        };

        $scope.$watch('messenger.conversation.loadingHistory',function(newValue,oldValue) {
            if (newValue && !oldValue) {
                $scope.$broadcast('chat.scroller.scroll', true);
            }
        });

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.visible=true;
            var user_id = +kendoEvent.view.params.id;

            //console.log('chat init data');
            //console.log(messengerService.conversation);
            //console.log(user_id);

            if (!$scope.data.dontScrollDownAfterReturn) {
                $timeout(function () {
                    $scope.$broadcast('chat.scroller.scroll', true);
                });
            } else {
                $scope.data.dontScrollDownAfterReturn=false;
            }

            if (self.isForwardingMessages) {
                //$timeout(function(){
                //    $scope.$broadcast('chat.scroller.scroll', true);
                //});
                self.isForwardingMessages=false;
                return;
            }

            if (!messengerService.conversation || messengerService.conversation.user_id!=user_id) {
                delete $scope.data.selection;
                $log.debug('reinit');
                //$timeout(function(){
                    //$log.debug('show loading');
                    //kendo.mobile.application.showLoading();

                    //$timeout(function() {
                        self.conversationUserInit = user_id;

                        $scope.data.currentDate = new Date();

                        var usersList = $filter('objectToList')(messengerService.users);
                        if (usersList.length) {
                            messengerService.openConversation(self.conversationUserInit,true);
                            $log.debug('hide loading');
                            //kendo.mobile.application.hideLoading();
                            $log.debug('scroll down after opening existing conversation');
                            $timeout(function(){
                                //$scope.$broadcast('chat.scroller.scroll', true);
                                $scope.$broadcast('chat.scroller.checkLoadingMedia', true);
                            });
                            //}
                            self.conversationUserInit = -1;
                        }
                    //},200);
                //},0);
            } else {
                $timeout(function(){
                    $scope.$broadcast('chat.resize');
                });
            }

            if (angular.isString(kendoEvent.view.params.message) && kendoEvent.view.params.message!=='') {
                messengerService.conversation.message.text=kendoEvent.view.params.message;
            }
        };

        $scope.data.gotoProfile=function(id) {
            if(!messengerService.users[id] || !messengerService.users[id].is_group_chat) {
                kendo.mobile.application.navigate('view-user-profile.html?id='+id);
            }
        };


        $scope.data.getMoreHistory=function() {
            if (new Date().getTime()<1000+$scope.data.lastTimeHistoryLoaded) return;
            $scope.$broadcast('chat.scroller.measure',messengerService.getMoreHistory);
            //messengerService.getMoreHistory();
        };

        $scope.data.onHide = function(kendoEvent) {
            $scope.data.visible=false;
            self.endAudioCapture();
            if (!$scope.data.dontCloseConversationThisTime) {
                messengerService.closeConversation();
                $scope.data.selectionDone();
            } else {
                delete $scope.data.dontCloseConversationThisTime;
            }
        };

        $scope.data.showGallery = function(message) {

            messengerService.checkAndLoadMessageFile(message, function(fileEntry) {
                messengerService.messageClicked(message);
                $scope.data.dontCloseConversationThisTime=true;
                $scope.data.dontScrollDownAfterReturn=true;
                //kendo.mobile.application.navigate('view-conversation-gallery.html?message_id=' + message.id + '&user_id=' + messengerService.conversation.user_id);
                kendo.mobile.application.navigate('view-photoswipe.html?message_id=' + message.id + '&user_id=' + messengerService.conversation.user_id);
            });
        };


        $scope.$watch('messenger.users', function(users, users_old){
            if (users !== users_old && self.conversationUserInit !== -1) {
                messengerService.openConversation(self.conversationUserInit);
            }
        }, true);


        $scope.data.lastTimeHistoryLoaded=0;

        $scope.$watch('messenger.conversation.loadingHistory', function(newValue, oldValue) {
            if (!newValue && oldValue) {
                $log.debug('hide loading');
                //$timeout(kendo.mobile.application.hideLoading,1000);
                kendo.mobile.application.hideLoading();
                $scope.data.lastTimeHistoryLoaded=new Date().getTime();
            }
        });

        $scope.$watch('messenger.conversation.loadingMoreHistory', function(newValue, oldValue) {
            if (!newValue && oldValue) {
                $scope.data.lastTimeHistoryLoaded=new Date().getTime();
                $timeout(function() {
                    $scope.$broadcast('chat.scroller.scroll', false);
                });
            }
        });
    }
});
