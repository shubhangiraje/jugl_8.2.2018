var modalService=angular.module('ModalService', []);

modalService.factory('modal',function($cordovaDialogs,$rootScope,$cordovaSplashscreen,gettextCatalog,$log) {

    var factory={};

    var displayHttpErrorModal=true;

    factory.showErrors=function(errors, title) {
        var showMessage = '';
        for(var i=0; i<errors.length; i++) {

            if(errors[i] == 'NOT_ENOUGH_JUGL') {
                errors[i] = gettextCatalog.getString('Du hast leider nicht genug Jugls auf Deinem Konto.');
            }

            showMessage += (i+1)+'. '+errors[i]+'\n';

        }
        var data = {
            message:showMessage
        };
        if (angular.isDefined(title)) {
            data.title = title;
        }

        factory.alert(data);
    };

    factory.confirmOkCancel=function(config) {
        if (angular.isString(config)) config={message:config};

        if (!angular.isString(config.title)) {
            config.title= gettextCatalog.getString('Confirm');
        }

        if (!angular.isArray(config.buttonArray)) {
            config.buttonArray = [
                gettextCatalog.getString('Ok'),
                gettextCatalog.getString('Cancel')
            ];
        }

        return $cordovaDialogs.confirm(config.message,config.title,config.buttonArray);
    };

    factory.confirmYesCancel=function(config) {
        if (angular.isString(config)) config={message:config};

        if (!angular.isString(config.title)) {
            config.title= gettextCatalog.getString('Confirm');
        }

        if (!angular.isArray(config.buttonArray)) {
            config.buttonArray = [
                gettextCatalog.getString('Yes'),
                gettextCatalog.getString('Cancel')
            ];
        }

        return $cordovaDialogs.confirm(config.message,config.title,config.buttonArray);
    };
	
	factory.confirmChangeTeam=function(config) {
        if (angular.isString(config)) config={message:config};

        if (!angular.isString(config.title)) {
            config.title= gettextCatalog.getString('Confirm');
        }

        if (!angular.isArray(config.buttonArray)) {
            config.buttonArray = [
                gettextCatalog.getString('Ja, Teamleiter wechseln'),
                gettextCatalog.getString('Nein, beim aktuellen Teamleiter bleiben')
            ];
        }

        return $cordovaDialogs.confirm(config.message,config.title,config.buttonArray);
    };


    factory.alert=function(config) {
        if (angular.isString(config)) config={message:config};

        if (!angular.isString(config.title)) {
            config.title= gettextCatalog.getString('Hinweis');
        }
        return $cordovaDialogs.alert(config.message,config.title,config.buttonName);
    };


    factory.error=function(config) {
        if (angular.isString(config)) config={message:config};

        return factory.alert({
            title:config.title||gettextCatalog.getString('Fehlermeldung!'),
            message:config.message
        });
    };

    factory.httpError=function(data, status, headers, config) {
        if (kendoInitialized()) {
            kendo.mobile.application.hideLoading();
        }
        if (status>0) {
            if (status==403 || status==401) {
                $log.debug('got unauthorized response, going to login form');
                kendoGoLoginAfterInitialization();
                return;
            } else {
                if (displayHttpErrorModal) {
                    displayHttpErrorModal = false;
                    factory.error({
                        message: gettextCatalog.getString('Error while performing server request (code {{status}})', {status: status})
                    }).then(function (res) {
                        displayHttpErrorModal = true;
                    });
                }
            }
        } else {
            if (displayHttpErrorModal) {
                displayHttpErrorModal = false;
                factory.error({
                    message: gettextCatalog.getString('Can\'t connect to server. Check your internet connection')
                }).then(function (res) {
                    displayHttpErrorModal = true;
                });
            }
        }
    };

    return factory;
});
