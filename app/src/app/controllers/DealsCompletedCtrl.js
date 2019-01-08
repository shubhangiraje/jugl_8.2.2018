app.controller('DealsCompletedCtrl', function ($scope,jsonDataPromise,jsonPostDataPromise,$timeout,$rootScope,$log, gettextCatalog, modal) {

    if (!$scope.data) {

        $scope.data={
            log: {
                filter:{
                    type: ''
                },
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1,
                items: [],
                hasMore: false
            }
        };

        $scope.data.gotoProfile=function(id) {
            kendo.mobile.application.navigate('view-user-profile.html?id='+id);
        };

        $scope.data.undelete=function(item) {
            if (item.type=='offer') {
                jsonPostDataPromise('/ext-api-offer/undelete',{id:item.deal.id}).then(function(data){
                    if (data.result===true) {
                        item.deal.status=data.status;
                        if (item.dealOffers.length===0) {
                            for(var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx]==item) {
                                    $scope.data.log.items.splice(idx,1);
                                    break;
                                }
                            }
                        }
                    }
                });
            }

            if (item.type=='search_request') {
                jsonPostDataPromise('/ext-api-search-request/undelete',{id:item.deal.id}).then(function(data){
                    if (data.result===true) {
                        item.deal.status=data.status;
                        if (item.dealOffers.length===0) {
                            for(var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx]==item) {
                                    $scope.data.log.items.splice(idx,1);
                                    break;
                                }
                            }
                        }
                    }
                });
            }
        };

        $scope.data.unlink=function(item) {
            if (item.type=='offer') {
                modal.confirmYesCancel({message:gettextCatalog.getString('Willst du Dein Angebot endgültig löschen?')}).then(function(result) {
                    if (result!=1) {
                        return;
                    }

                    jsonPostDataPromise('/ext-api-offer/unlink',{id:item.deal.id}).then(function(data){
                        if (data.result===true) {
                            for(var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx]==item) {
                                    $scope.data.log.items.splice(idx,1);
                                    break;
                                }
                            }
                        }
                    });
                });
            }

            if (item.type=='search_request') {
                modal.confirmYesCancel({message:gettextCatalog.getString('Möchtest Du Deine Suchanzeige endgültig löschen?')}).then(function(result) {
                    if (result!=1) {
                        return;
                    }

                    jsonPostDataPromise('/ext-api-search-request/unlink',{id:item.deal.id}).then(function(data){
                        if (data.result===true) {
                            for(var idx in $scope.data.log.items) {
                                if ($scope.data.log.items[idx]==item) {
                                    $scope.data.log.items.splice(idx,1);
                                    break;
                                }
                            }
                        }
                    });
                });
            }

        };


        $scope.$watch('data.log.filter',function(newValue,oldValue) {
            if (newValue!=oldValue) {
                $scope.data.log.items=[];
                $scope.data.log.refresh();
            }
        },true);

        $scope.data.onShow = function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
                $scope.data.log.refresh();
                $rootScope.refreshFlag=false;
            }

            if(kendoEvent.view.params.filter) {
                $scope.data.log.filter.type = kendoEvent.view.params.filter;
            } else {
                $scope.data.log.filter.type = '';
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

            jsonDataPromise('/ext-api-deals-completed/search', {
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


        $rootScope.$on('ratingUpdateParams',function(event,data){

            var idx,idxs;

            var search_request_offer_id = data.search_request_offer_id;
            var offer_request_id = data.offer_request_id;
            var rating = data.rating;

            if(search_request_offer_id > 0) {
                for (idx in $scope.data.log.items) {
                    for(idxs in $scope.data.log.items[idx].dealOffers) {
                        if($scope.data.log.items[idx].dealOffers[idxs].id == search_request_offer_id) {
                            $scope.data.log.items[idx].dealOffers[idxs].rating = rating;
                        }
                    }
                }
            }

            if(offer_request_id > 0) {
                for (idx in $scope.data.log.items) {
                    for (idxs in $scope.data.log.items[idx].dealOffers) {
                        if ($scope.data.log.items[idx].dealOffers[idxs].id == offer_request_id) {
                            $scope.data.log.items[idx].dealOffers[idxs].rating = rating;
                        }
                    }
                }
            }

        });


        $rootScope.$on('counterRatingUpdateParams',function(event,data){
            var idx;
            var search_request_offer_id = data.search_request_offer_id;
            var offer_request_id = data.offer_request_id;
            var rating = data.rating;

            if(search_request_offer_id > 0) {
                for (idx in $scope.data.log.items) {
                    if($scope.data.log.items[idx].dealOffer) {
                        if($scope.data.log.items[idx].dealOffer.id==search_request_offer_id) {
                            $scope.data.log.items[idx].dealOffer.counter_rating = rating;
                        }
                    }
                }
            }

            if(offer_request_id > 0) {
                for (idx in $scope.data.log.items) {
                    if($scope.data.log.items[idx].dealOffer) {
                        if($scope.data.log.items[idx].dealOffer.id==offer_request_id) {
                            $scope.data.log.items[idx].dealOffer.counter_rating = rating;
                        }
                    }
                }
            }
        });


    }



});
