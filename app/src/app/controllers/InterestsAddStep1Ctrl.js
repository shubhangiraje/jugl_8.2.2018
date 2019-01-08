app.controller('InterestsAddStep1Ctrl', function ($scope,jsonDataPromise,$rootScope, $timeout,jsonPostDataPromise,gettextCatalog,modal) {

    if (!$scope.data) {
        $scope.data={
            interests: [],
            listViewOptions: {
                template: $('#template-level1-interests').html(),
                dataSource: new kendo.data.DataSource({
                    data: [],
                    sort: [
                        { field: "interest_sort", dir: "asc" },
                    ]
                })
            },
            type: {}
        };


        $scope.data.onShow=function(kendoEvent) {

            $scope.data.type = kendoEvent.view.params.type;

            if(kendoEvent.view.params.draft_id) {
                $scope.data.draft_id = kendoEvent.view.params.draft_id;
            }

            var interestType=null;
            switch($scope.data.type) {
                case 'addOffer':
                case 'updateDraftOffer':
                    interestType='OFFER';
                    break;
                case 'addSearch':
                case 'updateDraftSearch':
                    interestType='SEARCH_REQUEST';
                    break;
            }

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-interests/add-step1',{type:interestType})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        $scope.data.listViewOptions.dataSource.data(res.interests);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };

        $scope.data.nextLevelInterest = function(level1Id) {
            if(!$scope.data.draft_id) {
                kendo.mobile.application.navigate('view-interests-addstep2.html?type='+$scope.data.type+'&id='+level1Id);
            } else {
                kendo.mobile.application.navigate('view-interests-addstep2.html?type='+$scope.data.type+'&id='+level1Id+'&draft_id='+$scope.data.draft_id);
            }
        };

        $scope.data.saveInterest = function(level1Id) {
            switch($scope.data.type) {
                case 'addInterest':
                    $timeout(function(){
                        kendo.mobile.application.showLoading();

                        jsonPostDataPromise('/ext-api-user-interests/save-level1-interest', {level1Id:level1Id})
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
                    break;
                case 'addSearch':
                    $timeout(function() {
                        kendo.mobile.application.navigate('view-searches-add.html?ids=' + level1Id);
                    });
                    break;
                case 'addOffer':
                    $timeout(function() {
                        kendo.mobile.application.navigate('view-offers-add.html?ids=' + level1Id);
                    });
                    break;
                case 'updateDraftSearch':
                    $timeout(function() {
                        kendo.mobile.application.navigate('view-searches-draft-update.html?id='+$scope.data.draft_id+'&ids=' + level1Id);
                    });
                    break;
                case 'updateDraftOffer':
                    $timeout(function() {
                        kendo.mobile.application.navigate('view-offers-draft-update.html?id='+$scope.data.draft_id+'&ids=' + level1Id);
                    });
                    break;
                default:
            }
        };

    }

});
