app.controller('InviteMeByEmailCtrl', function ($scope,invite,$cordovaSpinnerDialog,status,jsonPostDataPromise,modal,gettextCatalog) {

    if (!$scope.data) {
        $scope.data={
        };

        $scope.data.onShow=function(kendoEvent) {
            $scope.data.result='';
            $scope.data.text = gettextCatalog.getString('Hiermit bist Du zu Jugl herzlich eingeladen!');
        };

        $scope.data.send=function() {

            $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'),gettextCatalog.getString('Contacting server'),true);
            jsonPostDataPromise('/ext-api-invitation/invite-by-email',{emails:invite.invitePerson.email,text:$scope.data.text})
                .then(function(data){
                    $cordovaSpinnerDialog.hide();
                    if (data.$allErrors.length===0) {

                        $scope.data.result = data.result;

                        if ($scope.data.result[invite.invitePerson.email]===true) {
                            modal.alert(gettextCatalog.getString('Einladung wurde erfolgreich gesendet')).then(function () {
                                kendo.mobile.application.navigate('#:back');
                            });
                        } else {
                            modal.alert($scope.data.result[invite.invitePerson.email]);
                        }

                        /*
                        modal.alert(gettextCatalog.getString('Einladungen wurde erfolgreich gesendet')).then(function(){
                            kendo.mobile.application.navigate('view-invite.html');
                        });
                        */
                        return;
                    } else {
                        var errorText='';
                        for( var field in data.$allErrors) {
                            errorText=errorText+'- '+data.$allErrors[field]+'\n';
                        }
                        modal.error(errorText);
                    }
                },function(){
                    $cordovaSpinnerDialog.hide();
                });
        };

    }

});
