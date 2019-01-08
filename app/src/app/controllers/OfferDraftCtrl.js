app.controller('OfferDraftCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,status,$rootScope,modal,gettextCatalog,$timeout,messengerService) {

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
            kendo.mobile.application.view().scroller.scrollTo(0, 0);
            $scope.data.log.refresh();
        };

        $scope.data.delete = function(id) {
            modal.confirmYesCancel({
                message: gettextCatalog.getString('Willst Du Deine Inserat endgültig löschen?'),
                title: gettextCatalog.getString('Inserat löschen')
            }).then(function(result) {
                if (result!=1) {
                    return;
                }

                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-offer-draft/delete',{id:id})
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

            jsonDataPromise('/ext-api-offer-draft/list', {
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

    }




});
