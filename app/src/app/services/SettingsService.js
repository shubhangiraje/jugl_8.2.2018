var settingsService=angular.module('SettingsService', []);

settingsService.factory('settingsService', function($localStorage,$interval,$http,auth, messengerService,gettextCatalog) {
    var factory = {
        settings: {
            notifications: {
                all: true,
                chat: true,
                activity: true,
                money: true,
                offer: true,
                search_request: true
            },
            sound: {
                all: true,
                chat: true,
                activity: true,
                money: true,
                offer: true,
				video: true,
                search_request: true
            },
            login: {
                auto: true
            },
            label: {
                on: gettextCatalog.getString('an'),
                off: gettextCatalog.getString('aus')
            }
        }
    };

    function intSave(data) {
        data = data || {};
        angular.extend(factory.settings, data);
        $localStorage.settings = factory.settings;
    }

    var ignoreLogoutOnNextPause=false;
    factory.ignoreLogoutOnNextPause=function() {
        if (!isIos()) {
            ignoreLogoutOnNextPause = true;
        }
    };

    document.addEventListener("pause", function () {
        if (factory.settings.login.auto) return;

        if (ignoreLogoutOnNextPause) {
            ignoreLogoutOnNextPause=false;
            return;
        }

        auth.logout();
    });

    factory.load = function() {
        var data = $localStorage.settings;
        if (!data) {
            intSave();
        } else {
            angular.extend(factory.settings, data);
        }
    };

    function saveToServer() {
        var lastSaved=(new Date()).getTime();

        if (messengerService.initialized && (!factory.settings.lastSaved || factory.settings.lastModified>factory.settings.lastSaved)) {
            $http.post(config.siteUrl+'/ext-api-settings/save',{
                settings: {
                    setting_notification_all: factory.settings.notifications.all,
                    setting_notification_chat: factory.settings.notifications.chat,
                    setting_notification_activity: factory.settings.notifications.activity,
                    setting_notification_money: factory.settings.notifications.money,
                    setting_notification_offer: factory.settings.notifications.offer,
                    setting_notification_search_request: factory.settings.notifications.search_request,
                    setting_sound_all: factory.settings.sound.all,
                    setting_sound_chat: factory.settings.sound.chat,
                    setting_sound_activity: factory.settings.sound.activity,
                    setting_sound_money: factory.settings.sound.money,
                    setting_sound_offer: factory.settings.sound.offer,
                    setting_sound_video: factory.settings.sound.video,
                    setting_sound_search_request: factory.settings.sound.search_request
                },
                device_uuid: config.deviceUuid
            })
                .error(function(data, status, headers, config) {
                })
                .success(function(data, status, headers, config) {
                    factory.settings.lastSaved=lastSaved;
                    intSave();
                });
        }
    }

    $interval(saveToServer,5*1000);

    factory.save = function(data) {
        intSave(data);
        $localStorage.settings.lastModified = (new Date()).getTime();
        saveToServer();
    };

    factory.load();

    return factory;
});
