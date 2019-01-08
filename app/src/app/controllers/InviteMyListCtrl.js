app.controller('InviteMyListCtrl', function ($scope,$timeout,jsonDataPromise,$rootScope,invite,status,$window) {

    if (!$scope.data) {

        $scope.data={
            log: {
                items: [],
                hasMore: false
            },
            state: {
                loading: false,
                updatedWhileLoading: false,
                pageNum: 1
            },
            currentCountry: [],
            countryList: [],
            user_status:{
                delay_invited_member:null
            }
        };

        var timer = null;

        $scope.data.invite=function(data) {
            invite.invite(data,$scope.data.refresh());
        };

        $scope.data.onShow = function(kendoEvent) {
            if ($rootScope.refreshFlag) {
                kendo.mobile.application.view().scroller.scrollTo(0, 0);
                $timeout(function(){
                    kendo.mobile.application.showLoading();
                    jsonDataPromise('/ext-api-invite-my-new2/index',{id:kendoEvent.view.params.id})
                        .then(function (res) {
                            angular.extend($scope.data,res);
                            $scope.data.countryIds = res.currentCountry[0].id;
                            kendo.mobile.application.hideLoading();
                        },function(){
                            kendo.mobile.application.hideLoading();
                        });
                });
                $rootScope.refreshFlag=false;
            }

            $rootScope.showBannerAdMob();
        };

        $scope.data.refresh=function() {
            $scope.data.state.pageNum=1;
            $scope.data.log.hasMore=false;
            $scope.data.load();
        };

        $scope.data.loadMore=function() {
            if ($scope.data.state.loading) return;
            $scope.data.state.pageNum++;
            $scope.data.load();
        };

        $scope.data.load = function() {
            var data=$scope.data.log;

            if ($scope.data.state.loading) {
                $scope.data.state.modifiedWhileLoading=true;
                $scope.data.user_status.delay_invited_member=$rootScope.status.user.delay_invited_member;
                return;
            }

            $scope.data.state.loading=true;

            jsonDataPromise('/ext-api-invite-my-new2/list', {
                country_ids:$scope.data.countryIds,
                pageNum: $scope.data.state.pageNum
            }).then(function (res) {
                    $scope.data.state.loading=false;

                    if ($scope.data.state.pageNum > 1) {
                        res.log.items = data.items.concat(res.log.items);
                    }
                    angular.extend(data, res.log);

                    if ($scope.data.state.modifiedWhileLoading) {
                        $scope.data.state.modifiedWhileLoading=false;
                        $scope.data.load();
                    }

                $scope.data.user_status.delay_invited_member=$rootScope.status.user.delay_invited_member;
                $timeout.cancel(timer);
                $scope.data.callDelayInvitedMemberTimeout();
					
            },function(){
                $scope.data.state.loading=false;
            });
        };


        $scope.$watch('data.currentCountry',function(newValue,oldValue) {
            if (newValue != oldValue) {
                $scope.data.countryIds = '';
                if($scope.data.currentCountry.length > 0) {
                    $scope.data.countryIds = [];
                    angular.forEach($scope.data.currentCountry,function(item,index){
                        $scope.data.countryIds.push(item.id);
                    });
                    $scope.data.countryIds = $scope.data.countryIds.join(',');
                }

                $scope.data.refresh();
            }
        },true);

        $rootScope.$on('BecomeMemberInviteWinner',function(event,winner) {
            for(var idx in $scope.data.log.items) {
                var invite=$scope.data.log.items[idx];
                if (invite.id==winner.user_id) {
                    invite.winner=winner;
                }
                $scope.data.log.items[idx]=angular.copy(invite);
            }
        });

        $scope.labels=$rootScope.status.labels;

        $scope.data.callDelayInvitedMemberTimeout = function() {
            timer=$timeout( function(){
                $scope.data.user_status.delay_invited_member = 0;
            },$rootScope.status.user.delay_invited_member*1000);
        };

        $scope.data.onHide = function(kendoEvent) {
            $rootScope.hideBannerAdMob();
        };




    }

});
