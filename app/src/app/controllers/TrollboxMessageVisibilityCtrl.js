app.controller('TrollboxMessageVisibilityCtrl', function (status,modal,$rootScope,$scope,gettextCatalog,jsonPostDataPromise,jsonDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data = {
            trollboxMessage: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            if (status.user.is_blocked_in_trollbox) {
                $('#view-trollbox-message-visibility-popup').kendoMobileModalView("close");
                modal.alert({message: gettextCatalog.getString("Du wurdest für alle Foren von einem Moderator gesperrt")});
            } else {
                $scope.data.trollboxMessage = {};
                $scope.data.trollboxMessage = JSON.parse(kendoEvent.target.attr('data-trollbox-message-text'));
                $scope.data.trollboxCountryIds = kendoEvent.target.attr('data-trollbox-country-ids');
                $scope.data.trollboxCategoryList = JSON.parse(kendoEvent.target.attr('data-trollbox-category-list'));
                $scope.data.trollboxMessage.saving = false;
            }
        };

        $scope.data.send = function() {

            if ($scope.data.trollboxMessage.is_video_identification) {
                modal.confirmYesCancel({
                    message: gettextCatalog.getString('Um Deinen ersten Post bei uns veröffentlichen zu können musst Du Dich zuerst mittels Video durch unsere Community verifizieren lassen.'),
                    buttonArray: [
                        gettextCatalog.getString('Jetzt Video Ident starten'),
                        gettextCatalog.getString('Cancel')
                    ]
                }).then(function(result) {
                    if (result!=1) {
                        return;
                    }
                    kendo.mobile.application.navigate('#view-add-video-identification.html');
                });
                return;
            }

            if($scope.data.trollboxMessage.visible_for_followers!=1 && $scope.data.trollboxMessage.visible_for_contacts!=1 && $scope.data.trollboxMessage.visible_for_all!=1 ) {
                modal.alert(gettextCatalog.getString('Bitte mindestens eine Option wählen.'));
            } else {
                $timeout(function(){
                    $scope.data.trollboxMessage.saving = true;
                    kendo.mobile.application.showLoading();
                    jsonPostDataPromise('/ext-api-trollbox-new2/send-message', {trollboxMessage:  $scope.data.trollboxMessage, country_ids: $scope.data.trollboxCountryIds})
                        .then(function (res) {
                            $('#view-trollbox-message-visibility-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();
                            $scope.data.trollboxMessage.saving = false;
                            if(res.trollboxMessage.$allErrors.length===0) {
                                $rootScope.$broadcast('setTrollboxMessage', res.trollboxMessages);
                                if (res.message) {
                                    modal.alert({message:res.message});
                                }
                            } else {
                                modal.showErrors(res.trollboxMessage.$allErrors);
                            }
                        },function(){
                            kendo.mobile.application.hideLoading();
                            $scope.data.trollboxMessage.saving = false;
                        });
                });
            }
        };

    }

});
