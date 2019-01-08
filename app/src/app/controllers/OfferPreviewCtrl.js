app.controller('OfferPreviewCtrl', function ($scope,$rootScope,$timeout,jsonPostDataPromise,modal,gettextCatalog) {

    if (!$scope.data) {

        $scope.data={
            offer: {
                saving: false
            }
        };

        $scope.data.onShow = function(kendoEvent) {
            kendo.mobile.application.view().scroller.scrollTo(0, 0);

            $scope.data.offer = $rootScope.offerPreviewData;

            if(kendoEvent.view.params.draft_id) {
                $scope.data.draft_id = kendoEvent.view.params.draft_id;
            }

        };

        $scope.data.showGallery = function(index, images) {
            $rootScope.imagesGallery = {
                'index': index,
                'images': images
            };
            kendo.mobile.application.navigate('view-photoswipe.html?isGallery=true');
        };


        $scope.data.openAgb = function() {
            modal.alert({
                title: gettextCatalog.getString('AGB'),
                message: $scope.data.offer.user.agb
            });
        };

        $scope.data.save = function() {

            var params = {
                offer: $rootScope.offerSaveData
            };

            if($scope.data.draft_id) {
                params.draftId = $scope.data.draft_id;
            }
            $scope.data.offer.saving = true;
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-offer/save', params)
                    .then(function (res) {
                        if(res.result) {
                            $scope.data.offer.saving = false;
                            modal.alert(
                                res.willBeValidated ?
                                    gettextCatalog.getString('Deine Inserat wurde gespeichert und wird nun durch unser Team geprüft. Wenn Deine Inserat angenommen oder abgelehnt wird, erhälst Du eine Benachrichtigung')
                                    :
                                    gettextCatalog.getString('Du hast Deine Inserat erfolgreich geschaltet. Du findest Deine Inserat unter "Inserat schalten - Inserat verwalten"')
                            );
                            $rootScope.refreshFlag=true;
                            $rootScope.offerSaveData=null;
                            $rootScope.offerPreviewData=null;
                            kendo.mobile.application.navigate('view-offers-my.html');
                            kendo.mobile.application.hideLoading();
                        } else {
                            $scope.data.offer.$errors = res.offer.$errors;
                            $scope.data.offer.saving = false;
                            modal.showErrors(res.offer.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        $scope.data.offer.saving = false;
                        kendo.mobile.application.hideLoading();
                    });

            });

        };


    }
});
