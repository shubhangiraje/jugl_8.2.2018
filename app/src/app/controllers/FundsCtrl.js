app.controller('FundsCtrl', function ($log,$scope,jsonDataPromise,jsonPostDataPromise,status,$rootScope,modal,gettextCatalog) {

    function refreshIfActive() {
        $log.debug('auto refresh funds log');
        if (kendo.mobile.application.view().id=='view-funds.html') {
            $scope.data.log.refresh();
        }
    }

    if (!$scope.data) {

        var statusFilter={
            0:'',
            1:'positive',
            2:'negative'
        };

        $scope.data={
            log: {
                filter:{
                    status: 0
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false,
                sort: '-dt'
            },
            tokenLog: {
                filter:{
                    status: 0
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false,
                sort: '-dt'
            },
            tokenDepositLog: {
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            },
            statusFilterOptions: {
                select: function(e) {
                    $scope.data.log.filter.status=e.index;
                    $scope.$apply();
                },
                index: 0
            },
            statusFilterTokenOptions: {
                select: function(e) {
                    $scope.data.tokenLog.filter.status=e.index;
                    $scope.$apply();
                },
                index: 0
            },
            typeFund: {
                select: function(e) {
                    $scope.data.typeFund.index = e.index;
                    $scope.$apply();
                },
                index: 0
            }

        };

        $scope.data.onShow = function(kendoEvent) {
            status.update();
            $scope.data.log.refresh();
            $scope.data.tokenLog.refresh();
            //$scope.data.tokenDepositLog.refresh();
        };

        $scope.data.gotoProfile=function(id) {
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };

        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.refresh();
            }
        },true);

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

            jsonDataPromise('/ext-api-funds/log', {
                status: statusFilter[data.filter.status],
                sort: data.sort,
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

        $scope.data.setSort=function (field) {
            if ($scope.data.log.sort==field) {
                $scope.data.log.sort='-'+field;
                return;
            }
            if ($scope.data.log.sort=='-'+field) {
                $scope.data.log.sort=field;
                return;
            }
            $scope.data.log.sort=field;
        };


        $scope.$watch('data.log.sort',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.refresh();
            }
        },true);



        $scope.$watch('data.tokenLog.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.tokenLog.refresh();
            }
        },true);

        $scope.data.tokenLog.refresh=function() {
            $scope.data.tokenLog.pageNum=1;
            $scope.data.tokenLog.hasMore=false;
            $scope.data.tokenLog.load();
        };

        $scope.data.tokenLog.loadMore=function() {
            var data=$scope.data.tokenLog;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.tokenLog.load = function() {
            var data=$scope.data.tokenLog;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-funds/token-log', {
                status: statusFilter[data.filter.status],
                sort: data.sort,
                pageNum: data.pageNum
            })
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

        $scope.data.setSortToken=function (field) {
            if ($scope.data.tokenLog.sort==field) {
                $scope.data.tokenLog.sort='-'+field;
                return;
            }
            if ($scope.data.tokenLog.sort=='-'+field) {
                $scope.data.tokenLog.sort=field;
                return;
            }
            $scope.data.tokenLog.sort=field;
        };


        $scope.$watch('data.tokenLog.sort',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.tokenLog.refresh();
            }
        },true);



        $scope.data.tokenDepositLog.refresh=function() {
            $scope.data.tokenDepositLog.pageNum=1;
            $scope.data.tokenDepositLog.hasMore=false;
            $scope.data.tokenDepositLog.load();
        };

        $scope.data.tokenDepositLog.loadMore=function() {
            var data=$scope.data.tokenDepositLog;
            if (data.loading) return;
            data.pageNum++;
            data.load();
        };

        $scope.data.tokenDepositLog.load = function() {
            var data=$scope.data.tokenDepositLog;

            if (data.loading) {
                data.modifiedWhileLoading=true;
                return;
            }

            data.loading=true;

            jsonDataPromise('/ext-api-funds/token-deposit-log', {pageNum: data.pageNum})
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.items = data.items.concat(res.items);
                    }

                    angular.extend(data, res);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };


        $scope.data.payoutTypeToggle = function(item) {
            item.saving=true;
            jsonPostDataPromise('/ext-api-funds/payout-type-toggle',{
                id: item.id,
            }).then(function (data) {
                item.saving=false;
                item.payout_type=data.payout_type;
                var message=gettextCatalog.getString("Auszahlung wurde zu")+" ";
                message=message+(item.payout_type=='TOKENS' ? gettextCatalog.getString("Tokens"):gettextCatalog.getString("Jugls"))+" ";
                message=message+gettextCatalog.getString("geändert");

                modal.alert({message:message});
            },function(){
                item.saving=false;
            });
        };


        $rootScope.$on('statusUpdateRequested',refreshIfActive);
        $rootScope.$on('refreshFunds',refreshIfActive);
        document.addEventListener("resume", refreshIfActive);
    }

});
