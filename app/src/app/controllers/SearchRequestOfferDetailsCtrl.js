app.controller('SearchRequestOfferDetailsCtrl', function ($scope,jsonDataPromise, jsonPostDataPromise, $rootScope, $timeout, modal,messengerService,gettextCatalog) {

    function loadData() {
        $timeout(function(){
            kendo.mobile.application.showLoading();
            jsonDataPromise('/ext-api-search-request-offer/details',{id:$scope.data.id})
                .then(function (res) {
                    angular.extend($scope.data,res);
                    kendo.mobile.application.hideLoading();
                },function(){
                    kendo.mobile.application.hideLoading();
                });

            $scope.data.kendoEvent.view.scroller.scrollTo(0, 0);
        });
    }

    if (!$scope.data) {
        $scope.data = {
        };

        $scope.data.contact=function() {
            messengerService.addSystemMessage($scope.data.searchRequestOffer.user.id,'/ext-api-search-request-offer/mark-as-contacted',angular.copy({id:$scope.data.searchRequestOffer.id}));
            kendo.mobile.application.navigate('view-chat.html?id='+$scope.data.searchRequestOffer.user.id);
        };

        $scope.data.accept=function() {
            jsonPostDataPromise('/ext-api-search-request-offer/accept',{id:$scope.data.searchRequestOffer.id}).then(function(data) {
                if (data.result!==true) {
                    modal.confirmYesCancel({
                        message: data.result,
                        buttonArray: [
                            gettextCatalog.getString('Jugls aufladen'),
                            gettextCatalog.getString('Später aufladen')
                        ]
                    }).then(function(result) {
                        if (result!=1) {
                            return;
                        }
                        $rootScope.openUrlInBrowser(config.urls.payin);
                    });
                } else {
                    loadData();
                }
            });
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.kendoEvent=kendoEvent;
            $scope.data.searchRequestOffer = {};
            $scope.data.id=kendoEvent.view.params.id;
            loadData();
        };

        $scope.data.showGallery = function(index, images) {
            $rootScope.imagesGallery = {
                'index': index,
                'images': images
            };
            kendo.mobile.application.navigate('view-photoswipe.html?isGallery=true');
        };


    }
});
