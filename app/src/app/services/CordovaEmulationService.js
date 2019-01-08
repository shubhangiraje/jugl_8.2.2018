var modalService=angular.module('CordovaEmulationService', [],function(){
    var factory={};

    function init() {
        var uuid=window.localStorage.getItem("uuid-"+platform);
        if (!uuid) {
            uuid=Math.random();
            window.localStorage.setItem("uuid-"+platform,uuid);
        }

        window.cordova = {
            InAppBrowser: {
                open: function (url,target) {
                    window.open(url,'_blank');
                }
            }
        };

        window.cordova.getAppVersion={
            getVersionNumber: function() {
                return {
                    then: function(callback) {
                        setTimeout(function() {callback('0.0.0');},0);
                    }
                };
            }
        };

        window.device = {
            uuid: uuid,
            model: 'BROWSER'
        };

        window.navigator.globalization= {
            getPreferredLanguage: function (successCallback, errorCallback) {
                setTimeout(function(){
                    successCallback({value:'de-DE'});
                },0);
            }
        };

        window.navigator.splashscreen= {
            hide: function () {}
        };

        window.ContactFindOptions=function() {
        };

        window.navigator.contacts= {
            pickContact: function(contactSuccess,contactError) {
                var contact={
                    "name": {
                        "familyName":"Иванов",
                        "givenName":"Иван",
                        "formatted":"Иван Иванов"
                    },
                    "birthday":"--04-30",
                    "phoneNumbers":[
                        {
                            "id":"1565",
                            "pref":false,
                            "value": "+375 33 333 3333",
                            "type":"mobile"
                        },
                        {
                            "id":"1566",
                            "pref":false,
                            "value":"+7 333 333-33-33",
                            "type":"mobile"
                        }
                    ],
                    "emails":[
                        {
                            "id":"3361",
                            "pref":false,
                            "value":"ivan.ivanov@gmail.com",
                            "type":"home"
                        }
                    ],
                    "addresses":[
                        {
                            "id":"3362",
                            "pref":false,
                            "type":"home",
                            "formatted":"Адрес Дом",
                            "streetAddress":"Адрес Дом"
                        },{
                            "id":"3363",
                            "pref":false,
                            "type":"work",
                            "formatted":"Адрес Работа",
                            "streetAddress":"Адрес Работа"
                        }
                    ]
                };
                setTimeout(function() {contactSuccess(contact);},100);
            },

            find: function (fields, callbackOK, callbackError) {
                setTimeout(function () {
                    var data = [
                        {
                            id: 1,
                            name: {
                                formatted: 'Max Mustermann 1'
                            },
                            phoneNumbers: [
                                {
                                    value: '+49001'
                                }
                            ]
                        },
                        {
                            id: 2,
                            name: {
                                formatted: 'Max Mustermann 2'
                            },
                            phoneNumbers: [
                                {
                                    value: '+49002'
                                }
                            ]
                        }
                    ];
                    callbackOK(data);
                }, 1000);
            }
        };

        window.sms= {
            send: function (phone, text, options, callbackOK, callbackError) {
                    //console.log('sending SMS to number "' + phone + '":\n' + text);
                    setTimeout(callbackOK, 1000);
                }
        };

        /*jshint -W082 */
        window.PushNotification={
            init: function() {
                return {
                    on: function (event,callback) {
                        if (event==='registration') {
                            setTimeout(callback({registrationId:'BROWSER-PUSH-TOKEN-'+uuid}),100);
                        }
                    }
                };
            }
        };
        /*jshint +W082 */

        window.plugins={
            CallNumber: {
                callNumber: function(successCallback,failCallback,number) {
                    alert('call number '+number);
                }
            },
            pushNotification: {
                register: function (callbackOK,callbackERR) {
                    setTimeout(function() {
                        callbackOK('BROWSER-PUSH-TOKEN-'+uuid);
                        },100);
                }
            },
            spinnerDialog: {
                show: function (title,message,persistent) {
                    var code="<div id='spinner-dialog' style='background:white;padding:5px;text-align:center;z-index:10000;position:absolute;left:50%;top:50%;width:300px;margin-left:-150px;margin-top:-50px;height:100px;border:1px solid black;'>";
                    if (title) {
                        code=code+'<h3>'+title+'</h3>';
                    }
                    if (message) {
                        if (title) {
                            code=code+'<br/>';
                        }
                        code=code+message;
                    }

                    code=code+'</div>';
                    $('body').append(code);
                },
                hide: function() {
                    $("#spinner-dialog").remove();
                }
            }
        };
    }

    if (!window.cordova) {
        init();
    }

    return factory;
});
