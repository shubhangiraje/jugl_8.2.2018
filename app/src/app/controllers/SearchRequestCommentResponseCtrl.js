app.controller('SearchRequestCommentResponseCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            comment: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.comment.response = '';

            $timeout(function(){
                kendo.mobile.application.showLoading();

                jsonDataPromise('/ext-api-search-request-comment/response-update', {
                    id:kendoEvent.target.attr('data-id')
                })
                    .then(function (data) {
                        angular.extend($scope.data,data);
                        kendo.mobile.application.hideLoading();
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.save = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-search-request-comment/response-save', {comment: $scope.data.comment})
                    .then(function (data) {
                        if(data.result) {
                            $('#view-search-request-comment-response-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();
                            $rootScope.$broadcast('searchRequestCommentResponse',data.comment);
                        } else {
                            modal.showErrors(data.comment.$allErrors);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });

        };


    }


});