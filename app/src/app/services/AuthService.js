var authService=angular.module('AuthService', []);

authService.factory('getAuthKey',function($localStorage) {

    return function() {
        return $localStorage["authKey-"+platform+'-'+ENV];
    };

});

authService.factory('updateAuthHeaders',function($log,$http,$localStorage,$cordovaDevice,getAuthKey) {
    config.deviceUuid=$cordovaDevice.getModel()+'|'+$cordovaDevice.getUUID();

    return function(headersObject) {
        if (!headersObject) {
            headersObject=$http.defaults.headers.common;
        }

        headersObject['X-Ext-Api-Auth-Type']=config.extApiAuthType;
        headersObject['X-Ext-Api-Auth-Device-Uuid']=config.deviceUuid;
        headersObject['X-Ext-Api-Auth-Version']=config.appVersion;
        headersObject['X-Ext-Api-Auth-Key']=getAuthKey();

        $log.debug('getAuthKey: '+getAuthKey());
    };
});

authService.factory('auth',function($http,$localStorage,jsonPostDataPromise,$q,updateAuthHeaders,status,messengerService,getAuthKey,offlineCacheService,$log) {

    function setAuthKey(val) {
        $log.debug('setAuthKey: '+val);
        $localStorage["authKey-"+platform+'-'+ENV] = val;
        $log.debug('getAuthKey: '+getAuthKey());
    }

    var factory={
    };

    factory.isLogined=function() {
        var authKey=getAuthKey();
        return angular.isString(authKey) && authKey.length>0;
    };

    factory.login=function(username,password) {
        var defer=$q.defer();

        var extApiLoginForm= {
            type: config.extApiAuthType,
            device_uuid: config.deviceUuid,
            username: username,
            password: password
        };

        jsonPostDataPromise('/ext-api-base/login',{
            ExtApiLoginForm:extApiLoginForm
        }).then(function(data) {
            if (data.key) {
                setAuthKey(data.key);
                updateAuthHeaders();
                status.update();
                defer.resolve(true);
            } else {
                defer.resolve(data.error);
            }
        });

        return defer.promise;
    };
	
	factory.loginFacebook=function(access_token,facebook_id,facebookUser) {
        var defer=$q.defer();
	
        var extApiLoginForm= {
            type: config.extApiAuthType,
            device_uuid: config.deviceUuid,
            access_token: access_token,
            facebook_id:facebook_id,
			facebook_user:angular.toJson(facebookUser)
        };

        jsonPostDataPromise('/ext-api-base/login-facebook',{
            ExtApiLoginForm:extApiLoginForm
        }).then(function(data) {
            if (data.key) {
                setAuthKey(data.key);
                updateAuthHeaders();
                status.update();
                defer.resolve(data.facebook_user);
            }
			else if(data.error) {
                defer.resolve(data);
            }
            else if(data.redirect){
                defer.resolve(data);
            }
			else if(data.register){
                defer.resolve(data);
            }
        });

        return defer.promise;
    };

    factory.logout=function() {
        jsonPostDataPromise('/ext-api-base/logout');
        setAuthKey(null);
        updateAuthHeaders();
        messengerService.logout();
        kendo.mobile.application.replace('view-login.html');
        offlineCacheService.clear();
		facebookConnectPlugin.logout();
    };

    return factory;
});
