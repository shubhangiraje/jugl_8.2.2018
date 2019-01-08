app.controller('InviteMeBySmsCtrl', function ($scope,invite,$cordovaSpinnerDialog,$cordovaSms,modal,status,jsonPostDataPromise,gettextCatalog) {

    if (!$scope.data) {
        $scope.data= {};

        $scope.data.text = gettextCatalog.getString('Hiermit bist Du zu Jugl herzlich eingeladen!');

        $scope.data.send=function() {
            if ($scope.data.text.length===0) {
                modal.alert(gettextCatalog.getString('Please specify invitation text'));
                return;
            }

            $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'),gettextCatalog.getString('Contacting server'),true);
            var contacts=[];
            contacts.push({address:invite.invitePerson.phone,name:invite.invitePerson.first_name+' '+invite.invitePerson.last_name});

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
                        var text=link+'\n'+$scope.data.text;
                        sms.push({phone:phone,text:text});
                    }

                    var currentSendingSmsNum=0;

                    function sendNextSms(err) {
                        if (err) {
                            modal.error(err);
                        }

                        if (sms.length<=currentSendingSmsNum) {
                            $cordovaSpinnerDialog.hide();
                            modal.alert(gettextCatalog.getString('Einladung wurde erfolgreich gesendet')).then(function(){
                                kendo.mobile.application.navigate('#:back');
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
    }

    $scope.data.phones={};
});
