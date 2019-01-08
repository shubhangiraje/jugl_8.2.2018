app.controller('ViewVideoIdentificationPopupCtrl', function ($scope,$rootScope,jsonDataPromise,jsonPostDataPromise,$timeout,modal) {

    if (!$scope.data) {

        $scope.data = $rootScope.trollboxMessage;

        /*jshint -W082 */
        function resizeBox() {
            var container = $('#view-video-identification-popup').closest('.k-animation-container');
            var contentHeight = $('#view-video-identification-popup .modal-resize-box').height();
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
        }
        /*jshint +W082 */

        $rootScope.$on('videoIdentificationPopupResize',function() {
            resizeBox();
        });

        $scope.data.viewVotesVideo = function(id, type) {
            $rootScope.infoPopup.showTrollboxVotes=false;
            jsonDataPromise('/ext-api-trollbox-new/votes',{id:id, type: type})
                .then(function(data){
                    $rootScope.messageVotes=data;
                    $rootScope.messageVotes.type = type;
                    $rootScope.infoPopup.showTrollboxVotes=true;
                    $timeout(function() {
                        $('#view-votes-trollbox-popup').kendoMobileModalView('open');
                        $timeout(function(){
                            $rootScope.$broadcast('votesTrollboxPopupResize');
                        }, 50);
                    });
                });
        };

        /*jshint -W082 */
        function trollboxVote(id,vote) {
            kendo.mobile.application.showLoading();
            jsonPostDataPromise('/ext-api-trollbox-new/vote-message', {id: id, vote: vote})
                .then(function (res) {
                    kendo.mobile.application.hideLoading();
                    if (res.message) {
                        $scope.data.trollboxMessage=res.message;
                        resizeBox();
                    }
                    modal.alert({message:res.result});
                },function(){
                    kendo.mobile.application.hideLoading();
                });
        }
        /*jshint +W082 */

        $scope.data.trollboxVoteUp=function(id) {
            $rootScope.showInterstitialAdMob(function(result) {
                if (result) {
                    trollboxVote(id,1);
                }
            });
        };

        $scope.data.trollboxVoteDown=function(id) {
            trollboxVote(id,-1);
        };

        $scope.data.enterGroupChat=function(id) {
            $timeout(function(){
                kendo.mobile.application.showLoading();
                jsonPostDataPromise('/ext-api-trollbox-new/enter-group-chat', {id: id})
                    .then(function (res) {
                        kendo.mobile.application.hideLoading();
                        if(res.result===true) {
                            kendo.mobile.application.navigate('view-chat.html?id='+res.groupChatId);
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });
            });
        };

        $scope.data.onClose = function(kendoEvent) {
            $rootScope.$broadcast('videoIdentificationDestroy', true);
        };


    }


});