var statusService=angular.module('StatusService', []);
// init pushService at application startup
statusService.run(function(status) {});

statusService.factory('status',function(jsonDataPromise,jsonPostDataPromise,updateAuthHeaders,$timeout,modal,gettextCatalog,messengerService,$rootScope,$q,$cordovaSplashscreen,offlineCacheService,$log,serverTime,$localStorage,$pixel) {
    var factory={
        user:{}
    };

    var prevStatus;
    var prevPacket=null;
    var is_update_country_after_login = false;

    function hideSplashIfNeeded(gotStatusFromServer) {
        if ($rootScope.showingSplash) {
            $rootScope.showingSplash=false;

            var cachedStatus=offlineCacheService.getStatus();

            if (isCordova() && !gotStatusFromServer && !cachedStatus) {
                kendoGoLoginAfterInitialization();
            }

            if (cachedStatus) {
                messengerService.setChatAuthKey(cachedStatus.chatAuthorizationKey);
            }
            
            /*
            if (isCordova() && (gotStatusFromServer || cachedStatus)) {
                // on phone point user to view-login or view-contacts after application load
                //$log.debug('got status response from server, going to contacts');
                //kendo.mobile.application.replace('#view-contacts');
            }
            */

            if (!gotStatusFromServer && cachedStatus) {
                angular.extend(factory,cachedStatus);
            }
        }
    }

    factory.update=function(newStatusData) {
	    $rootScope.refreshFlag=true;
        $log.debug('send status update request');
        jsonDataPromise('/ext-api-base/status').then(function(data) {
            serverTime.setCurrentServerTime(data.serverTime);
            $log.debug('got status update response');
            hideSplashIfNeeded(true);

            if (data.forRootScope) {
                angular.extend($rootScope,data.forRootScope);
            }

            angular.extend(factory,data);

            // preload avatar
            if (factory.user.avatarMobile) {
                var img=new Image();
                img.src=factory.user.avatarMobile;
            }

            messengerService.setChatAuthKey(data.chatAuthorizationKey);
            offlineCacheService.setStatus(data);

            if (data && data.user) {
               /* if (data.user.status=='LOGINED' && prevStatus!='LOGINED') {
                    console.log('going to fillup!');
                    kendo.mobile.application.navigate('#view-profile-fillup.html');
               }*/

                if (data.user.status=='ACTIVE' && prevStatus=='LOGINED') {
                    //console.log('going to dashboard!');
                    kendo.mobile.application.navigate('#view-dashboard.html');
                }

                if (data.user.packet==='' && prevPacket!=='' && !data.user.not_force_packet_selection) {
                    kendo.mobile.application.navigate('#view-registration-payment.html');
                }

                if (data.user.packet!=='' && prevPacket==='') {
                    kendo.mobile.application.navigate('#view-dashboard.html');
                }

                if((!$localStorage.showProfileFillup || (new Date()).getTime() > $localStorage.showProfileFillup) && (!data.user.birthday || data.user.birthday==='') && (!data.user.city || data.user.city==='') && (data.user.packet=='VIP_PLUS' || data.user.packet=='VIP' || data.user.packet=='STANDART')) {
                    kendo.mobile.application.navigate('#view-profile-fillup.html');
                }

                if(window.location.hash == '#view-profile-fillup.html' && data.user.birthday && data.user.city && (data.user.packet=='VIP_PLUS' || data.user.packet=='VIP' || data.user.packet=='STANDART')) {
                    kendo.mobile.application.navigate('#view-dashboard.html');
                }


                if (!$rootScope.isShowValidationPhoneNotification) {
                    $rootScope.isShowValidationPhoneNotification = (new Date()).getTime();
                }

                if ($rootScope.isShowValidationPhoneNotification<((new Date()).getTime() - 2*60*1000)) {
                    if (data.user.packet !== null && data.user.packet !== '' && data.user.status == 'ACTIVE' && data.user.validation_phone_status != 'VALIDATED' && data.user.birthday && data.user.city) {
                        jsonDataPromise('/ext-api-user-validation-phone-notification/get').then(function (data) {
                            if (!data.result) return false;
                            $timeout(function () {
                                $('#view-validation-phone-popup').kendoMobileModalView('open');
                            }, 1000);
                        });
                    }
                }
                prevStatus=data.user.status;
                prevPacket=data.user.packet;

                if (data.user.showTeamleaderFeedbackNotification) {
                    $('#view-user-team-feedback-popup').kendoMobileModalView('open',{isNotification:true});
                    $timeout(function(){
                        $rootScope.$broadcast('UserTeamFeedbackUpdateOpen',{isNotification:true});
                    });
                }

                if(data.user.pixel_registration_notified===0) {
                    if (!$rootScope.isPixelRegistrationNotified) {
                        $pixel.track('CompleteRegistration', {
                            content_name: data.user.first_name+' '+data.user.last_name,
                            status: data.user.status
                        });
                    }
                    $rootScope.isPixelRegistrationNotified = true;
                    jsonDataPromise('/ext-api-base/update-pixel-registration-notified').then(function(data){});
                }

                if (data.user.is_update_country_after_login === 0 && !is_update_country_after_login) {
                    is_update_country_after_login = true;
                    jsonDataPromise('/ext-api-base/auto-update-country').then(function(data){
                        if (data.result) {
                            modal.alert({message: gettextCatalog.getString('Ihre Sprach- und Landeinstellungen wurden automatisch angepasst')});
                            factory.update();
                        }
                    });
                }

            }

        },function(){
            hideSplashIfNeeded(false);
        });
    };

    // be sure that first status call is made with correct authentication headers
    updateAuthHeaders();
/*
    // is called after connecting to websocket
    document.addEventListener("resume", function () {
        factory.update();
    });
*/
    $rootScope.$on('statusUpdateRequestedAfterConnectToWebsocket',function(){
        factory.update();
    });

    $rootScope.$on('statusUpdateRequested',function(){
        factory.update();
    });


    factory.inviteFriendsStartTime = function() {
        var defer=$q.defer();
        var data = {};

        jsonPostDataPromise('/ext-api-base/invite-friends-start-time')
            .then(function (res) {

                var timeStart=(new Date(res.invitation_notification_start)).getTime();
                var timeLeft=Math.ceil((serverTime.getCurrentServerTime()-timeStart)/1000);
                var time = 86400-timeLeft;

                if(time<=0 || res.invite_friends_count>5 || res.invite_friends_count<0) {
                    data.showPopup = false;
                } else {
                    data.timeLeft = res.invitation_notification_start;
                    data.showPopup = true;
                }
                defer.resolve(data);
            },function(){
                data.showPopup = false;
                defer.reject(data);
            });

        return defer.promise;
    };


    cordova.getAppVersion.getVersionNumber().then(function (version) {
        config.appVersion=version;
        updateAuthHeaders();
        factory.update();
    });

    return factory;
});
