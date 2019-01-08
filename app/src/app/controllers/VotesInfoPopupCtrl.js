app.controller('VotesInfoPopupCtrl', function ($scope,$rootScope,jsonDataPromise,$timeout) {

    if (!$scope.data) {

        $scope.data = $rootScope.infoVotes;

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

            jsonDataPromise('/ext-api-info/list-votes-comment',{id:$scope.data.comment_id, pageNum: data.pageNum})
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

        $rootScope.$on('infoPopupVotesResize',function() {

            var container = $('#view-votes-info-popup').closest('.k-animation-container');
            var contentHeight = $('#view-votes-info-popup .modal-resize-box').height();
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
                    container.css({height: heightWindow - 100 + 'px'});
                }
            }

            if(isWp()) {
                $('#view-info-popup').css({overflow: 'auto'});
                if((contentHeight + padding + border) > heightWindow) {
                    container.css({height: heightWindow - 100 + 'px'});
                }
            }

        });


    }


});