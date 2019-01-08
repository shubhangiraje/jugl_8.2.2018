app.controller('SearchRequestCommentCtrl', function ($scope,jsonDataPromise,modal,jsonPostDataPromise,$timeout,$rootScope) {

    if (!$scope.data) {

        $scope.data = {
            comment: {}
        };

        $scope.data.onOpen = function(kendoEvent) {
            $scope.data.comment.comment = '';
            $scope.data.comment.search_request_id = kendoEvent.target.attr('data-search-request-id');
        };

        $scope.data.save = function() {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-search-request-comment/save', {comment: $scope.data.comment})
                    .then(function (data) {
                        if(data.result) {
                            $('#view-search-request-comment-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();
                            $rootScope.$broadcast('searchRequestCommentAdd', data.comments);
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