app.controller('InviteSmsSendCtrl', function ($scope,$rootScope,$cordovaSpinnerDialog,$cordovaSms,modal,status,jsonPostDataPromise,gettextCatalog) {

    if (!$scope.data) {
        $scope.data={
            text: gettextCatalog.getString('Hallo, schau Dir diese neue App an und gib mir bitte ein Feedback. Liebe Grüße\n{link}\n\n\nUnd hier noch das Video dazu:\nhttps://youtu.be/X5h0JSLQP-Y'),
            listViewOptions: {
                template: $('#template-invite-sms-contacts-item').html(),
                dataSource: new kendo.data.DataSource({
                    data: [],
                    group: 'letter'
                }),
                style: 'inset',
                fixedHeaders: true
            }
        };

        $scope.data.send=function() {
            if ($scope.data.text.length===0) {
                modal.alert(gettextCatalog.getString('Please specify invitation text'));
                return;
            }

            $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'),gettextCatalog.getString('Contacting server'),true);
            var contacts=[];
            for(var i in $rootScope.selectedContacts) {
                contacts.push({address:$rootScope.selectedContacts[i].phone,name:$rootScope.selectedContacts[i].name});
            }

            jsonPostDataPromise('/ext-api-invitation/invite-by-sms',{contacts: contacts,text:$scope.data.text})
                .then(function(data){
                    $cordovaSpinnerDialog.hide();
                    $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'),gettextCatalog.getString('Sending SMS'),true);

                    var options = {
                        replaceLineBreaks: false, // true to replace \n by a new line, false by default
                        android: {
                            //intent: 'INTENT'  // send SMS with the native android SMS messaging
                            intent: '' // send SMS without open any other app
                        }
                    };

                    var sms=[];
                    for(var phone in data.result) {
                        var link=data.result[phone];
                        var text=$scope.data.text.replace('{link}',link);

                        sms.push({phone:phone,text:text});
                    }

                    var currentSendingSmsNum=0;

                    function sendNextSms(err) {
                        if (err) {
                            modal.error(err);
                        }

                        if (sms.length<=currentSendingSmsNum) {
                            $cordovaSpinnerDialog.hide();
                            modal.alert(gettextCatalog.getString('Einladungen wurde erfolgreich gesendet')).then(function(){
                                kendo.mobile.application.navigate('view-invite.html');
                            });
                            return;
                        }

                        $cordovaSms.send(sms[currentSendingSmsNum].phone,sms[currentSendingSmsNum].text,options)
                            .then(function(){sendNextSms(null);},function(err) {sendNextSms(err);});

                        currentSendingSmsNum++;
                    }

                    sendNextSms(null);

                },function(){
                    $cordovaSpinnerDialog.hide();
                });
        };

        $scope.data.onShow=function(kendoEvent) {
            if (!$rootScope.selectedPhones || $rootScope.selectedPhones.length===0) {
                kendo.mobile.application.navigate('view-invite-sms.html');
            }

        };
    }

    $scope.data.phones={};

});
