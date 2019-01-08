app.controller('SearchRequestDetailCtrl', function ($scope,jsonDataPromise, jsonPostDataPromise, $rootScope, $timeout) {

    if (!$scope.data) {
        $scope.$on('spamReported',function() {
            $scope.data.searchRequest.spamReported=true;
        });

        $scope.data={
            searchRequest: {},
            comments: {}
        };

        $scope.data.onShow = function(kendoEvent) {
            $scope.data.searchRequest = {};
            $scope.data.comments = {};

            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonDataPromise('/ext-api-search-request/details',{id:kendoEvent.view.params.id})
                    .then(function (res) {
                        angular.extend($scope.data,res);
                        kendo.mobile.application.hideLoading();

                        $scope.data.comments.loading = false;
                        $scope.data.comments.updatedWhileLoading= false;
                        $scope.data.comments.pageNum = 1;

                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

                kendoEvent.view.scroller.scrollTo(0, 0);
            });
        };

        $scope.data.spamReport=function(data) {
            $rootScope.$broadcast('spamReportPopup', data);
            $('#view-spam-report-popup').kendoMobileModalView('open');
        };


        $scope.data.addFavorite = function(id) {
            jsonPostDataPromise('/ext-api-favorites/add',{id:id, type:'search_request'})
                .then(function (data) {
                    if (data.result===true) {
                        $scope.data.searchRequest.favorite = true;
                    }
                });

        };

        $scope.data.showGallery = function(index, images) {
            $rootScope.imagesGallery = {
                'index': index,
                'images': images
            };
            kendo.mobile.application.navigate('view-photoswipe.html?isGallery=true');
        };

        $rootScope.$on('searchRequestCommentAdd',function(event,data){
            $scope.data.comments.pageNum = 1;
            angular.extend($scope.data.comments, data);
        });

        $rootScope.$on('searchRequestCommentResponse',function(event,data) {
            for(var idx in $scope.data.comments.items) {
                var comment=$scope.data.comments.items[idx];
                if (comment.id==data.id) {
                    angular.extend(comment,data);
                }
            }
        });


        $scope.data.commentsLoadMore = function() {
            if ($scope.data.comments.loading) return;
            $scope.data.comments.pageNum++;
            $scope.data.commentsLoad();
        };

        $scope.data.commentsLoad = function() {

            if ($scope.data.comments.loading) {
                $scope.data.comments.modifiedWhileLoading=true;
                return;
            }

            $scope.data.comments.loading=true;

            jsonDataPromise('/ext-api-search-request/list-comments', {
                searchRequestId: $scope.data.searchRequest.id,
                pageNum: $scope.data.comments.pageNum
            })
                .then(function (data) {
                    $scope.data.comments.loading=false;

                    if ($scope.data.comments.pageNum > 1) {
                        data.comments.items = $scope.data.comments.items.concat(data.comments.items);
                    }

                    angular.extend($scope.data.comments, data.comments);

                    if ($scope.data.comments.modifiedWhileLoading) {
                        $scope.data.comments.modifiedWhileLoading=false;
                        $scope.data.commentsLoad();
                    }
                },function(){
                    $scope.data.comments.loading=false;
                });
        };


    }
});
