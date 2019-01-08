app.controller('InviteEmailCtrl', function ($scope,$cordovaSpinnerDialog,status,jsonPostDataPromise,modal,gettextCatalog) {

    if (!$scope.data) {
        $scope.data={
            //emails: '',
            //text: 'Ich möchte Dich einladen, der schnell wachsenden Gemeinde von jugl.net beizutreten.',
        };

        $scope.data.onShow=function(kendoEvent) {
            $scope.data.emails='';
            $scope.data.result='';
            $scope.data.text = gettextCatalog.getString('Hallo, schau Dir diese neue App an und gib mir bitte ein Feedback. Liebe Grüße\n{link}\n\n\nUnd hier noch das Video dazu:\nhttps://youtu.be/X5h0JSLQP-Y');
        };

        $scope.data.send=function() {

            $cordovaSpinnerDialog.show(gettextCatalog.getString('Einladung Verschiken'),gettextCatalog.getString('Contacting server'),true);
            jsonPostDataPromise('/ext-api-invitation/invite-by-email',{emails:$scope.data.emails,text:$scope.data.text})
                .then(function(data){
                    $cordovaSpinnerDialog.hide();
                    if (data.$allErrors.length===0) {

                        $scope.data.result = data.result;
                        /*
                        modal.alert(gettextCatalog.getString('Einladungen wurde erfolgreich gesendet')).then(function(){
                            kendo.mobile.application.navigate('view-invite.html');
                        });
                        */
                        return;
                    } else {
                        var errorText='';
                        for( var field in data.$allErrors) {
                            errorText=errorText+'- '+data.$allErrors[field];
                        }
                        modal.error(errorText);
                    }
                },function(){
                    $cordovaSpinnerDialog.hide();
                });
        };

    }

});
