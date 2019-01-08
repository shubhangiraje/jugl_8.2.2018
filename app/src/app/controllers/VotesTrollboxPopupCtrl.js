app.controller('VotesTrollboxPopupCtrl', function ($scope,$rootScope,jsonDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data = $rootScope.messageVotes;
        $scope.data.log.pageNum=1;

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

            var params = {
                id:$scope.data.message_id,
                pageNum: data.pageNum
            };

            if ($scope.data.type) {
                params.type = $scope.data.type;
            }

            jsonDataPromise('/ext-api-trollbox/votes-list', params)
                .then(function (res) {
                    data.loading=false;

                    if (data.pageNum > 1) {
                        res.log.items = data.items.concat(res.log.items);
                    }

                    angular.extend(data, res.log);

                    if (data.modifiedWhileLoading) {
                        data.modifiedWhileLoading=false;
                        data.load();
                    }
                },function(){
                    data.loading=false;
                });
        };

        $rootScope.$on('votesTrollboxPopupResize',function() {

            var container = $('#view-votes-trollbox-popup').closest('.k-animation-container');
            var contentHeight = $('#view-votes-trollbox-popup .modal-resize-box').height();
            var padding = 2 * 10;
            var border = 2 * 1;

            var heightWindow = $(window).height();

            if (isAndroid()) {
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 100 + 'px'});
                } else {
                    container.css({height: contentHeight + padding + border + 'px'});
                }
            }

            if(isIos()){
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 70 + 'px'});
                } else {
                    container.css({height: contentHeight + padding - 20 + border + 'px'});
                }
            }
        });


    }


});