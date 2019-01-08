app.controller('VideoDetailCtrl', function ($scope,jsonDataPromise, $rootScope, $timeout, $interval, messengerService, jsonPostDataPromise, modal, gettextCatalog) {

 	if(!$scope.data){

		
        $scope.data={
            video: {}
        };
		var timeoutPromise = null;
		$scope.data.video.complete = false;
		var params;
		

        $scope.data.onShow = function(kendoEvent) {
			$scope.data.video = {};
			$timeout(function(){
				$scope.data.stateView = 'show';
				kendo.mobile.application.showLoading();
				jsonDataPromise('/ext-api-video/details',{id:kendoEvent.view.params.id}).then(function (res) {
					angular.extend($scope.data,res);
					params = {
						video_id: res.video.video_id,
						bonus: res.video.bonus
					};
					kendo.mobile.application.hideLoading();
				},function(){
					kendo.mobile.application.hideLoading();
				});

			 	kendoEvent.view.scroller.scrollTo(0, 0);
			});
		
        };
		
		$scope.$watch(function() {
			return $scope.data.video.complete;
		}, function($newVal, $oldVal){
			if($newVal === true){	
				if(typeof($scope.data.video_user.id) == 'undefined') {
					timeoutPromise=$timeout(function(){
						$('#videos-details-view-bonus-popup').kendoMobileModalView('open');
						$rootScope.$broadcast('videoDetailsViewBonusPopup', params);
					},1000);
				}
			}
		});
		$scope.data.onHide = function(kendoEvent) {
			$timeout.cancel(timeoutPromise);
			$scope.data.video={complete:false};
        };
		
	}

});
