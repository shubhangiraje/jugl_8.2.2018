app.controller('VideoDetailsViewBonusPopupCtrl', function ($log,modal,jsonDataPromise,$rootScope,$scope,$interval,status,$timeout) {

    
if (!$scope.data) {
	
        $scope.data={};

        var intervalPromiseVideo = null;

        $rootScope.$on('videoDetailsViewBonusPopup',function(event,data){
            $scope.data.video_id = data.video_id;
            $scope.data.bonus = data.bonus;
            $scope.data.secondsLeftVideo = 10;

            $timeout(function() {
                var container = $('#videos-details-view-bonus-popup').closest('.k-animation-container');
                var contentHeight = $('#videos-details-view-bonus-popup .modal-bonus-container').height();
                var padding = 2 * 10;
                var border = 2 * 1;
                container.css({height: contentHeight + padding + border + 'px'});
            });

            intervalPromiseVideo = $interval(function(){	
                $scope.data.secondsLeftVideo--;
                if ($scope.data.secondsLeftVideo===0) {
                    $('#videos-details-view-bonus-popup').kendoMobileModalView('close');
                }
            },1000);
        });


        $scope.data.accept = function() {

            var params = {
                id:$scope.data.video_id
            };


            $timeout(function(){

                kendo.mobile.application.showLoading();

                 jsonDataPromise('/ext-api-video/set-video-balance',{id:$scope.data.video_id})
                    .then(function (res) {
                        if(res) {
                            status.update();
                            $('#videos-details-view-bonus-popup').kendoMobileModalView("close");
                            kendo.mobile.application.hideLoading();
                        } else {
                            modal.alert(res);
                            kendo.mobile.application.hideLoading();
                        }
                    },function(){
                        kendo.mobile.application.hideLoading();
                    });

            });

        };

        $scope.data.onClose = function(kendoEvent) {
			$interval.cancel(intervalPromiseVideo);
        };

}

   


});