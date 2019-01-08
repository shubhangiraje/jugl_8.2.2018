var app = angular.module('Jugl', [
    'kendo.directives',
    'ngStorage',
    //'ngTouch',
    'once',
    'ngCordova',
    'AuthService',
    'ModalService',
    'CordovaEmulationService',
    'MessengerService',
    'OfflineCacheService',
    'StatusService',
    'PushService',
    'SettingsService',
    'UploadService',
    'angularFileUpload',
    'monospaced.elastic',
    'ksSwiper',
    'gettext',
    'ngSanitize',
    'infoPopupService',
	'btorfs.multiselect',
    'tmh.dynamicLocale',
    'EmoticonService',
    'ServerTimeService',
    'InviteService',
    'ps-facebook-pixel'
    //'ImgCache'
    ])
    .config(function( $compileProvider, $logProvider, tmhDynamicLocaleProvider, $localStorageProvider, $pixelProvider /*, ImgCacheProvider*/ )
    {

        // Facebook Pixel config
        if(ENV=='PROD') {
            $pixelProvider.id = '381896798941261';
            $pixelProvider.disablePushState = true;
            $pixelProvider.delayPageView = true;
        }

        $localStorageProvider.setKeyPrefix('ngStorage_');
        // prevent "unsafe:" links problem in windows phone
        $compileProvider.aHrefSanitizationWhitelist(/^\s*/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*/);
        $logProvider.debugEnabled(DEBUG);
        tmhDynamicLocaleProvider.localeLocationPattern('js/angular-locale_{{locale}}.js');

        /*
        // set single options
        ImgCacheProvider.setOption('debug', true);
        ImgCacheProvider.setOption('usePersistentCache', true);

        // or more options at once
        ImgCacheProvider.setOptions({
            //debug: true,
            usePersistentCache: true,
            chromeQuota: 50*1024*1024,
            skipURIencoding: true
        });

        if (isCordova() && isAndroid()) {
            ImgCacheProvider.setOptions({
                localCacheFolder: 'JuglApp/imgcache',
            });
        }

        ImgCacheProvider.manualInit = true;
        */
    })
        .run(function($http,$rootScope,$timeout,$interval,$localStorage,messengerService,auth,status,settingsService,gettextCatalog,$cordovaGlobalization,infoPopup,$log,$cordovaSplashscreen,modal,jsonPostDataPromise,jsonDataPromise,tmhDynamicLocale,$pixel /*,ImgCache*/) {

        /*
        // use cache only on phones, to avoid collistion of window.requestFileSystem
        if (isCordova()) {
            ImgCache.$init();
        } else {
            ImgCache.helpers.isCordova=function() {
                return isCordova();
            };

            ImgCache.$init();
        }
        */

        document.addEventListener("pause",function() {
            $rootScope.$broadcast("pause");
        });

        document.addEventListener("resume",function() {
            $rootScope.$broadcast("resume");
            /*chcp.isUpdateAvailableForInstallation(function(error, data) {
                if (error) {
                  console.log('Nothing to install. Executing fetch.');
                  chcp.fetchUpdate(fetchUpdateCallback);
                  return;
                }
                // update is in cache and can be installed - install it
                console.log('Current version: ' + data.currentVersion);
                console.log('About to install: ' + data.readyToInstallVersion);
                chcp.installUpdate(installationCallback);
              });*/
        });

		document.addEventListener("backbutton",function() {	
            $rootScope.refreshFlag=false;
			kendo.mobile.application.navigate("#:back");
        });

		$rootScope.onClickBack=function(){
		    $rootScope.refreshFlag=false;
		};

        $rootScope.setLanguage=function(language) {
            config.language=language;
            gettextCatalog.setCurrentLanguage(language);
            tmhDynamicLocale.set(language);

            if (isCordova() && isAndroid()) {
                window.imagePicker.setStrings({
                    progressCaption: gettextCatalog.getString('Bilder werden verarbeitet'),
                    progressMessage: gettextCatalog.getString('Bitte warten...'),
                    maxCountCaption1: gettextCatalog.getString('Maximal'),
                    maxCountCaption2: gettextCatalog.getString('Bilder'),
                    maxCountMessage1: gettextCatalog.getString('Du kannst maximal'),
                    maxCountMessage2: gettextCatalog.getString('Bilder auswählen')
                });
            }

            $http.defaults.headers.common['X-Ext-Api-Language']=language;
        };

        $timeout(function() {
            $cordovaGlobalization.getPreferredLanguage().then(
                function(result) {
                    var res=result.value.match(/(de|en|ru)/);
                    if (res) {
                        $rootScope.setLanguage(res[1]);
                    }
                },
                function(error) {
                    // error
                });
        });


        $log.debug('start kendoui'); 

        // set kendo ui options
        $rootScope.kAppOptions = {
            platform: config.kendoPlatform,
            useNativeScrolling: false,
            init: function() {
                if (isWp()) {
                    // dirty hack for WP for hiding progress bar
                    var timesLeft = 10;
                    var intervalId;
                    intervalId=setInterval(function () {
                        kendo.mobile.application.hideLoading();
                        //console.log('hide loading dirty hack');
                        timesLeft=timesLeft-1;
                        if (timesLeft <= 0) {
                            clearInterval(intervalId);
                        }
                    }, 1000);
                }

                window.appInitialized=true;
                $log.debug('kendoui started, hide splash screen');
                $log.debug('hide splash screen');
                if (window.kendoGoLoginAfterInitializationFlag) {
                    kendoGoLoginAfterInitialization();
                }
                $timeout(function(){
                    $cordovaSplashscreen.hide();
                    if (status.user.packet==='') {
                        kendo.mobile.application.navigate('view-registration-payment.html');
                    }
                });
            }
        };

        $rootScope.showInfoPopup=function(id) {
            infoPopup.show(id);
        };

        $rootScope.isOneShowInfoPopup=function(id) {
            return infoPopup.isOneShow(id);
        };

        $rootScope.showStartPopup=function() {
            if(!$localStorage.startPopup && auth.isLogined()) {
                $timeout(function(){
                    $('#start-popup').kendoMobileModalView('open');

                    var container = $('#start-popup').closest('.k-animation-container');
                    var contentHeight = $('#start-popup .info-popup-box').height();
                    var padding = 2 * 10;
                    var border = 2 * 1;

                    var heightWindow = $(window).height();

                    if (isAndroid()) {
                        if((contentHeight + padding + border) > heightWindow) {
                            container.css({height: heightWindow - 60 + 'px'});
                        } else {
                            container.css({height: contentHeight + padding + border + 'px'});
                        }
                    }

                    if(isIos()){
                        if(contentHeight > heightWindow) {
                            container.css({height: heightWindow - 60 + 'px'});
                        }
                    }

                }, 1000);

                $localStorage.startPopup = true;
                return true;
            }

            return false;
        };

        $rootScope.showFriendsPopup=function () {
            if(!$localStorage.friendsPopup && status.user.status=='ACTIVE') {
                $timeout(function () {
                    status.inviteFriendsStartTime()
                        .then(function (data) {
                            if (data.showPopup) {
                                $('#invite-friends-popup').kendoMobileModalView('open');

                                var container = $('#invite-friends-popup').closest('.k-animation-container');
                                var contentHeight = $('#invite-friends-popup .info-popup-box').height();
                                var padding = 2 * 10;
                                var border = 2 * 1;

                                var heightWindow = $(window).height();

                                if (isAndroid()) {
                                    if((contentHeight + padding + border) > heightWindow) {
                                        container.css({height: heightWindow - 60 + 'px'});
                                    } else {
                                        container.css({height: contentHeight + padding + border + 'px'});
                                    }
                                }

                                if(isIos()){
                                    if(contentHeight > heightWindow) {
                                        container.css({height: heightWindow - 60 + 'px'});
                                    }
                                }

                                $rootScope.$broadcast('inviteFriendsPopup', data.timeLeft);
                            }
                        }, function () {
                            $log.debug('error inviteFriendsPopup');
                        });

                }, 300);

                $localStorage.friendsPopup = true;
                return true;
            }

            return false;
        };
		
		var successcache = function(status) {
            //console.log('Message: ' + status);
        };
 
		var errorcache = function(status) {
		    //console.log('Error: ' + status);
		};

        $rootScope.refreshFlag=true;
        $rootScope.refreshList=function() {
            $rootScope.refreshFlag=true;
			//console.log(window.cache);
			//window.cache.cleartemp();
        };
		
        $rootScope.status=status;
        $rootScope.messenger=messengerService;

        $rootScope.useNativeScrolling=isAndroid();

        // needed for opening links in external browser
        $rootScope.config=config;
        $rootScope.openUrlInBrowser=function(url,target,closeCallback) {
            if (!target) {
                target='_system';
            }
            var ref = cordova.InAppBrowser.open(url, target);

            if(ref!==undefined) {
                ref.addEventListener('loadstart', function(event) {
                    if(event.url.indexOf('#back_app')!==-1 || event.url.indexOf('?back_app')!==-1) {
                        ref.close();
                        if (closeCallback) {
                            closeCallback(event.url);
                        }
                    }
                });
            }

            //navigator.app.loadUrl(url,{openExternal:true});
        };

        $rootScope.dialNumber=function(number) {
            if(number!==null) {
                window.plugins.CallNumber.callNumber(function(){}, function(){}, number);
            } else {
                modal.alert({'message':gettextCatalog.getString('Der User hat seine Telefonnummer noch nicht angegeben.')});
            }
        };

        // needed for logout button
        $rootScope.auth=auth;

        $rootScope.showingSplash=true;

        $rootScope.navigate=function(view) {
            kendo.mobile.application.navigate(view);
        };

        $rootScope.translations = {

        };

        $rootScope.deleteProfile = function() {
            if(status.user.validation_phone_status!=='VALIDATED' && status.user.parent_registration_bonus===0) {
                modal.confirmYesCancel({
                    message: gettextCatalog.getString('Willst du wirklich dein Profil löschen?'),
                    buttonArray: [
                        gettextCatalog.getString('Profil löschen'),
                        gettextCatalog.getString('Cancel')
                    ]
                }).then(function(result) {
                    if (result!==1) return;
                    jsonPostDataPromise('/ext-api-profile/delete').then(function(data) {
                        if(data.result) {
                            auth.logout();
                        } else {
                            modal.alert({'message':gettextCatalog.getString('Um Dein Profil zu löschen, stelle bitte einen schriftlichen Antrag auf Löschung mit der eMail Adresse mit der Du Dich registriert hast. Bitte mit Vor- und Nachnamen, vollständiger Anschrift und deiner Unterschrift an juglapp@gmx.de. Wir bitten um Verständnis, dass wir dies fordern, um Missbrauch zu vermeiden.')});
                        }
                    });
                });

            } else {
                modal.alert({'message':gettextCatalog.getString('Um Dein Profil zu löschen, stelle bitte einen schriftlichen Antrag auf Löschung mit der eMail Adresse mit der Du Dich registriert hast. Bitte mit Vor- und Nachnamen, vollständiger Anschrift und deiner Unterschrift an juglapp@gmx.de. Wir bitten um Verständnis, dass wir dies fordern, um Missbrauch zu vermeiden.')});
            }
        };

        $rootScope.mainProfile = function() {
            kendo.mobile.application.navigate('view-user-profile.html?id='+status.user.id);
        };


        $rootScope.updateCountry = function(userId,dataObj) {
            if(status.user.is_moderator && status.user.allow_moderator_country_change) {
                jsonDataPromise('/ext-api-base/get-update-data-country',{id: userId}).then(function (data) {
                    var updateCountryData = {
                        userData: {
                            user_id: data.user.id,
                            country_id: data.user.country_id
                        },
                        countries: data.countries
                    };
                    $rootScope.updateCountryDataObject=dataObj;
                    $timeout(function(){
                        $('#view-user-country-update-popup').kendoMobileModalView('open');
                        $rootScope.$broadcast('showUserUpdateCountryPopup', updateCountryData);
                    });
                },function(){});
            }
        };

        $rootScope.showInterstitialAdMob = function(callback) {
            if (isCordova()) {
                AdMob.prepareInterstitial({
                    adId: 'ca-app-pub-5908295137597899/7307449159',
                    autoShow: true
                }, function() {
                    if (callback && typeof(callback) === 'function') {
                        callback(true);
                    }
                }, function() {
                    if (callback && typeof(callback) === 'function') {
                        callback(false);
                    }
                });
            } else {
                if (callback && typeof(callback) === 'function') {
                    callback(true);
                }
            }
        };

        $rootScope.showBannerAdMob = function() {
            if (isCordova()) {
                AdMob.createBanner({
                    adId:'ca-app-pub-5908295137597899/6012971402',
                    position: AdMob.AD_POSITION.BOTTOM_CENTER,
                    adSize: AdMob.AD_SIZE.SMART_BANNER,
                    autoShow: true
                });
            }
        };

        $rootScope.hideBannerAdMob = function() {
            if (isCordova()) {
                AdMob.hideBanner();
            }
        };

/*
            function successCallback(result) {
                console.log('sim');
                console.log(result);
            }

            function errorCallback(error) {
                console.log('sim');
                console.log(error);
            }

            window.plugins.sim.getSimInfo(successCallback, errorCallback);
*/
        $rootScope.marketingEnabled=!isIos();
});

app.factory('jsonDataPromise',function ($q,$http,modal) {
    return function(url,params,timeout) {
        var defer=$q.defer();

        $http.get(config.siteUrl+url,{params:params,timeout:timeout})
            .error(function(data, status, headers, config) {
                if(status == '404') {
                    kendo.mobile.application.replace('#view-error404.html');
                } else {
                    modal.httpError(data, status, headers, config);
                }
                defer.reject(data);
            })
            .success(function(data, status, headers, config) {
                defer.resolve(data);
            });

        return defer.promise;
    };
});


app.factory('jsonPostDataPromise',function ($q,$http,modal) {
    return function(url,params) {
        var defer=$q.defer();

        $http.post(config.siteUrl+url,params)
            .error(function(data, status, headers, config) {
                modal.httpError(data, status, headers, config);
                defer.reject(data);
            })
            .success(function(data, status, headers, config) {
                defer.resolve(data);
            });

        return defer.promise;
    };
});

/*fetchUpdateCallback=function(error, data) {
    if (error) {
      console.log('Failed to load the update with error code: ' + error.code);
      jsonDataPromise('/ext-api-update/update-error',{error:error});
      return;
    }
    console.log('Update is loaded');
	jsonDataPromise('/ext-api-update/update-loaded-success');
  },

  installationCallback=function(error) {
    if (error) {
      console.log('Failed to install the update with error code: ' + error.code);
      console.log(error.description);
	   jsonDataPromise('/ext-api-update/install-error',{error:error});
    } else {
      console.log('Update installed!');
	  jsonDataPromise('/ext-api-update/install-success');
    }
  }*/