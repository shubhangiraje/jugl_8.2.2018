app.controller('OfferHistoryViewPopupCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope,gettextCatalog) {
    if (!$scope.data) {

        $scope.data = {
            log: {},
            dateTimeFormat: gettextCatalog.getString("dd.MM.yyyy 'um' HH:mm")
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.userId = kendoEvent.target.attr('data-user-id');
            $scope.data.offerId = kendoEvent.target.attr('data-offer-id');

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-offer-view-log/history',{user_id:$scope.data.userId, offer_id: $scope.data.offerId})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        $scope.data.log.pageNum = 1;

                        $timeout(function() {
                            $('#view-offer-history-view-popup').data("kendoMobileModalView").scroller.scrollTo(0, 0);
                            var container = $('#view-offer-history-view-popup').closest('.k-animation-container');
                            var contentHeight = $('#view-offer-history-view-popup .modal-resize-box').height();
                            var padding = 2 * 10;
                            var border = 2 * 1;
                            container.css({height: contentHeight + padding + border + 'px'});
                        });

                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.loadMore=function() {
            var data=$scope.data.log;
            if (data.loading) return;
            data.pageNum++;
            $scope.data.load();
        };

        $scope.data.load = function() {
            var data=$scope.data.log;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-offer-view-log/history',{id:$scope.data.userId, pageNum: data.pageNum})
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.log.items = data.items.concat(res.log.items);
                    }

                    angular.extend(data, res.log);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        $scope.data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };



        /*

        $scope.data = $rootScope.offerViewHistoryData;

        $scope.data.dateTimeFormat = gettextCatalog.getString("dd.MM.yyyy 'um' HH:mm");
        $scope.data.log.pageNum=1;

        $scope.data.log.loadMore=function() {
            var data=$scope.data.log;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.log.load = function() {
            var data=$scope.data.log;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-offer-view-log/history',{id:$scope.data.log.user.id, pageNum: data.pageNum})
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.log.items = data.items.concat(res.log.items);
                    }

                    angular.extend(data, res.log);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

        $rootScope.$on('offerViewHistoryPopupResize',function() {

            var container = $('#view-offer-history-view-popup').closest('.k-animation-container');
            var contentHeight = $('#view-offer-history-view-popup .modal-resize-box').height();
            var padding = 2 * 10;
            var border = 2 * 1;

            var heightWindow = $(window).height();

            if (isAndroid()) {
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 100 + 'px'});
                } else {
                    container.css({height: contentHeight + padding + border + 'px'});
                }
            }

            if(isIos()){
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 100 + 'px'});
                }
            }

        });
        */

    }


});