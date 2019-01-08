app.controller('InterestsAddStep3Ctrl', function ($scope,jsonDataPromise,jsonPostDataPromise,$timeout,modal,gettextCatalog) {

    if (!$scope.data) {
        $scope.data={
            interests: [],
            listViewOptions: {
                template: $('#template-level3-interests').html(),
                dataSource: new kendo.data.DataSource({
                    data: [],
                    sort: [
                        { field: "interest_title", dir: "asc" },
                    ]
                })
            },
            type: {}
        };


        $scope.data.save=function() {

            var params = {
                level1Id: $scope.data.level_interests.level1_id,
                level2Id: $scope.data.level_interests.level2_id,
                level3Interests: $scope.data.level3Interests
            };

            $timeout(function() {
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-interests/save-level2-interest', params)
                    .then(function (res) {
                        if(res.result===true) {
                            modal.alert(gettextCatalog.getString('Du hast erfolgreich neue Interessen hinzugefügt.')).then(function() {
                                kendo.mobile.application.navigate('view-interests.html');
                            });
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        modal.error(gettextCatalog.getString('Error!'));
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

        $scope.data.saveAndCreateSearchRequest = function() {

            var params = {
                level1Id:$scope.data.level_interests.level1_id,
                level2Id:$scope.data.level_interests.level2_id,
                level3Interests: $scope.data.level3Interests
            };


            $timeout(function() {
                kendo.mobile.application.showLoading();

                jsonPostDataPromise('/ext-api-user-interests/save-level2-interest', params)
                    .then(function () {

                        if(!$.isEmptyObject($scope.data.level3Interests)) {
                            var ids = [];
                            for (var id in $scope.data.level3Interests) {
                                if ($scope.data.level3Interests[id] === true) {
                                    ids.push(id);
                                }
                            }

                            if((ids.length) > 0) {
                                $timeout(function() {
                                    kendo.mobile.application.navigate('view-searches-add.html?ids=' + ids.join(','));
                                }, 300);
                            } else {
                                $timeout(function(){
                                    kendo.mobile.application.navigate('view-searches-add.html?ids=' + $scope.data.level_interests.level2_id);
                                }, 300);
                            }

                        } else {
                            $timeout(function(){
                                  kendo.mobile.application.navigate('view-searches-add.html?ids=' + $scope.data.level_interests.level2_id);
                            }, 300);
                        }

                        kendo.mobile.application.hideLoading();
                    },function(){
                        modal.error(gettextCatalog.getString('Error!'));
                        kendo.mobile.application.hideLoading();
                    });

            });
        };


        $scope.data.saveSearchAndOffer = function() {

            if(!$.isEmptyObject($scope.data.level3Interests)) {
                var ids = [];

                for (var id in $scope.data.level3Interests) {
                    if ($scope.data.level3Interests[id] === true) {
                        ids.push(id);
                    }
                }

                if((ids.length) > 0) {
                    $timeout(function(){
                        switch($scope.data.type) {
                            case 'addOffer':
                                $timeout(function(){
                                    kendo.mobile.application.navigate('view-offers-add.html?ids=' + ids.join(','));
                                },300);
                                break;
                            case 'addSearch':
                                $timeout(function(){
                                    kendo.mobile.application.navigate('view-searches-add.html?ids=' + ids.join(','));
                                },300);
                                break;
                            case 'updateDraftSearch':
                                $timeout(function() {
                                    kendo.mobile.application.navigate('view-searches-draft-update.html?id='+$scope.data.draft_id+'&ids=' + ids.join(','));
                                });
                                break;
                            case 'updateDraftOffer':
                                $timeout(function() {
                                    kendo.mobile.application.navigate('view-offers-draft-update.html?id='+$scope.data.draft_id+'&ids=' + ids.join(','));
                                });
                                break;

                            default:
                        }
                    });
                } else {
                    $timeout(function(){
                        switch($scope.data.type) {
                            case 'addOffer':
                                $timeout(function(){
                                    kendo.mobile.application.navigate('view-offers-add.html?ids=' + $scope.data.level_interests.level2_id);
                                },300);
                                break;
                            case 'addSearch':
                                $timeout(function(){
                                    kendo.mobile.application.navigate('view-searches-add.html?ids=' + $scope.data.level_interests.level2_id);
                                },300);
                                break;
                            case 'updateDraftSearch':
                                $timeout(function() {
                                    kendo.mobile.application.navigate('view-searches-draft-update.html?id='+$scope.data.draft_id+'&ids=' + $scope.data.level_interests.level2_id);
                                });
                                break;
                            case 'updateDraftOffer':
                                $timeout(function() {
                                    kendo.mobile.application.navigate('view-offers-draft-update.html?id='+$scope.data.draft_id+'&ids=' + $scope.data.level_interests.level2_id);
                                });
                                break;
                            default:
                        }
                    });

                }
            } else {
                $timeout(function(){
                    switch($scope.data.type) {
                        case 'addOffer':
                            $timeout(function(){
                                kendo.mobile.application.navigate('view-offers-add.html?ids=' + $scope.data.level_interests.level2_id);
                            },300);
                            break;
                        case 'addSearch':
                            $timeout(function(){
                                kendo.mobile.application.navigate('view-searches-add.html?ids=' + $scope.data.level_interests.level2_id);
                            },300);
                            break;
                        default:
                    }
                });
            }

        };

        $scope.data.onShow=function(kendoEvent) {

            $scope.data.type = kendoEvent.view.params.type;

            if(kendoEvent.view.params.draft_id) {
                $scope.data.draft_id = kendoEvent.view.params.draft_id;
            }

            $timeout(function(){
                kendo.mobile.application.showLoading();

                if($scope.data.type=='addInterest') {
                    jsonDataPromise('/ext-api-interests/add-step3', {parent_id:kendoEvent.view.params.id})
                        .then(function (res) {
                            angular.extend($scope.data,res);
                            $scope.data.listViewOptions.dataSource.data(res.interests);
                            kendo.mobile.application.hideLoading();
                        },function(){
                            kendo.mobile.application.hideLoading();
                        });
                } else {
                    $scope.data.level3Interests = {};
                    jsonDataPromise('/ext-api-interests/searches-add-step3', {parent_id:kendoEvent.view.params.id})
                        .then(function (res) {
                            angular.extend($scope.data,res);
                            $scope.data.listViewOptions.dataSource.data(res.interests);
                            kendo.mobile.application.hideLoading();
                        },function(){
                            kendo.mobile.application.hideLoading();
                        });
                }

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };
    }

});
