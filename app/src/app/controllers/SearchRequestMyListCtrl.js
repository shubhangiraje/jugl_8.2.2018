app.controller('SearchRequestMyListCtrl', function ($scope,jsonDataPromise, jsonPostDataPromise, $timeout, modal,gettextCatalog, $rootScope) {

    if (!$scope.data) {

        $scope.data={
            log: {
                filter: {},
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

            jsonDataPromise('/ext-api-search-request-my-list/list', {
                filter: data.filter,
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
                },function(){
                    data.loading=false;
                });
        };

        $scope.data.delete = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Möchtest Du Deine Suchanzeige endgültig löschen?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-search-request/delete',{id:id})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.result===true) {
                            for (var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx].id == id) {
                                    $scope.data.log.items.splice(idx, 1);
                                }
                            }
                        }
                    });
            });
        };

        $scope.data.close = function(id) {
            modal.confirmYesCancel(gettextCatalog.getString('Nachdem Du deine Suchanzeige abschaltest, landet sie unter "Geschäfte & Bewertungen". Möchtest Du die Anzeige wirklich abschalten?')).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-search-request/close',{id:id})
                    .then(function (data) {
                        kendo.mobile.application.hideLoading();
                        if (data.result===true) {
                            for (var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx].id == id) {
                                    $scope.data.log.items.splice(idx, 1);
                                }
                            }
                        }
                    });
            });
        };


    }
});
