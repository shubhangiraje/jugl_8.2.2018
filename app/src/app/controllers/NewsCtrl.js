app.controller('NewsCtrl', function ($scope, jsonDataPromise, $rootScope, $timeout) {

    if (!$scope.data) {

        $scope.data={
            log: {
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };

        $scope.data.onShow = function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
                $scope.data.log.refresh();
                $rootScope.refreshFlag=false;
            }

            if(kendoEvent.view.params.id) {
                $scope.data.newsId = kendoEvent.view.params.id;
            }

        };

        $scope.data.log.refresh=function() {
            $scope.data.log.pageNum=1;
            $scope.data.log.hasMore=false;
            $scope.data.log.load();
        };

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

            jsonDataPromise('/ext-api-news/list', {
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.results.items = data.items.concat(res.results.items);
                    }

                    angular.extend(data, res.results);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }

                    if($scope.data.newsId) {
                        $timeout(function() {
                            var scroller=$('.km-content:visible').data('kendoMobileScroller');
                            var scrollTo = $('#news'+$scope.data.newsId).position().top;
                            scroller.scrollTo(0,-scrollTo);
                        });
                    }

                },function(){
                    data.loading=false;
                });
        };

    }
});
