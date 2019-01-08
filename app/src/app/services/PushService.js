var pushService=angular.module('PushService', []);
// init pushService at application startup
pushService.run(function(pushService) {});

pushService.factory('pushService',function($rootScope,modal,$q,messengerService,$log,$localStorage,settingsService,status) {
    $rootScope.$on('newIncomingMessageInChat',function(){
       playSound('default.wav','chat');
    });

    $rootScope.$on('newOutgoingMessageInChat',function() {
        playSound('outgoing_message.wav','chat');
    });

    function playSound(file,soundSettingName) {
        $log.debug('pushService: play sound '+file);

        if (!isCordova()) {
            return;
        }

        if (!settingsService.settings.sound.all ||  !settingsService.settings.sound[soundSettingName]) {
            $log.debug('pushService: sound disabled');
            return;
        }


        var media = new Media(isAndroid() ? '/android_asset/www/'+file:(isWp() ? 'www/'+file:file), function() {
            $log.debug('pushService: sound playing finished');
            media.release();
        }, function(error) {
            $log.debug('pushService: sound playing error: ');
            $log.debug(error);
        }, function(status) {

        });

        media.play();
    }

    //var tokenReceived
    var factory={
        token: ''
    };

    function openConversation(user_id) {
        if (!messengerService.users[user_id]) {
            kendo.mobile.application.navigate('#view-contacts');
            messengerService.getInitAndOpenChat(user_id);
        } else {
            if (messengerService.conversation && messengerService.conversation.user_id===user_id) {
                kendo.mobile.application.replace('view-chat.html?id=' + user_id+"&extra="+Math.random());
            } else {
                kendo.mobile.application.navigate('view-chat.html?id=' + user_id);
            }
        }
    }

    function tokenReceived(token) {
        $localStorage.pushToken=token;
        factory.token=token;
        $log.debug('received push token '+token);
        messengerService.setPushToken(token);
    }

    if ($localStorage.pushToken) {
        $log.debug('use cached pushToken');
        tokenReceived($localStorage.pushToken);
    }

    if (isAndroid() || isIos() || !isCordova()) {
        var push = PushNotification.init(config.cordovaPush);

        push.on('registration', function (e) {
            tokenReceived(e.registrationId);
        });

        push.on('error', function (e) {
            $log.error('PushService Error: ' + e.message);
        });

        push.on('notification', function (notification) {
            $log.debug('received notification');
            $log.debug(notification);

            // don't do anything if push was received in foreground
            if (notification.additionalData.foreground) {
                switch (notification.additionalData.type) {
                    //case 'CHAT':
                    //    playSound('coins.wav','chat');
                    //    break;
                    case 'EVENT':
                        playSound('activity.wav', 'activity');
                        break;
                    case 'PUSH':
                        switch (notification.additionalData.link) {
                            case 'view-invite.html':
                                status.inviteFriendsStartTime()
                                    .then(function (data) {
                                        if(data.showPopup) {
                                            $('#invite-friends-popup').kendoMobileModalView('open');
                                            $rootScope.$broadcast('inviteFriendsPopup', data.timeLeft);
                                        }
                                    }, function() {
                                        $log.debug('error inviteFriendsPopup');
                                    });
                                break;
                            default:
                                playSound('coins.wav', 'money');
                                $rootScope.$broadcast('refreshFunds');
                        }
                        break;
                }
                return;
            }

            switch (notification.additionalData.type) {
                case 'CHAT':
                    openConversation(+notification.additionalData.user_id);
                    break;
                case 'EVENT':
                    kendo.mobile.application.navigate('view-activities.html');
                    break;
                case 'PUSH':
                case 'offer':
                case 'search_request':
                    kendo.mobile.application.navigate(notification.additionalData.link);
                    break;
            }
        });
    }

    if (isWp() && isCordova()) {
        var pushConfig=angular.copy(config.cordovaPushWP);

        angular.extend(pushConfig,
            {
                "ecb": "onNotificationWP8",
                "uccb": "channelHandlerWP8",
                "errcb": "jsonErrorHandlerWP8"
            });

        // global functions for push handling in WP8
        window.channelHandlerWP8=function(result) {
            tokenReceived(result.uri);
        };

        window.errorHandlerWP8=function(error) {
            $log.debug('PushService error: '+error);
        };

        window.jsonErrorHandlerWP8=function(error) {
            $log.debug('PushService json error: '+error);
        };

        window.onNotificationWP8=function(notification) {
            $log.debug('notification received');
            $log.debug(notification);
            if (!notification || !notification.jsonContent || !angular.isString(notification.jsonContent['wp:Param'])) {
                $log.error('notification doesn\'t contain additional info');
                $log.error(notification);
                return;
            }

            var strData=notification.jsonContent['wp:Param'];
            strData=strData.substr('/MainPage.xaml?payload='.length);
            strData=decodeURIComponent(strData);

            var data={};
            try{
                data=angular.fromJson(strData);
            }catch(e){
                $log.error('notification\'s additional info is invalid');
                $log.error(notification);
            }

            switch (data.type) {
                //case 'CHAT':
                //    playSound('coins.wav','chat');
                //    break;
                case 'EVENT':
                    playSound('activity.wav', 'activity');
                    break;
                case 'PUSH':
                    playSound('coins.wav', 'money');
                    $rootScope.$broadcast('refreshFunds');
                    break;
            }
            return;

        };


        window.plugins.pushNotification.register(channelHandlerWP8,errorHandlerWP8,pushConfig);
    }

    return factory;
});
