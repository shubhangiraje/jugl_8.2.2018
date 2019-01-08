app.controller('AdvertisingViewBonusPopupCtrl', function ($log,modal,jsonDataPromise,$rootScope,$scope,$interval,status,$timeout) {
	if (!$scope.data) {
		
		$scope.data = {};
		var intervalPromiseAdvertising = null;
			
		$rootScope.$on('advertisingViewBonusPopup',function(event,params, ref){

			$scope.data.secondsLeft=params.popup_interval;
			//ref.addEventListener('loadstart', function() {
				$interval.cancel(intervalPromiseAdvertising);
				
				$timeout(function() {
					var container = $('#advertising-view-bonus-popup').closest('.k-animation-container');
					var contentHeight = $('#advertising-view-bonus-popup .modal-bonus-container').height();
					var padding = 2 * 20;
					var border = 2 * 1;
					container.css({height: contentHeight + padding + border + 'px'});
				});
				
				intervalPromiseAdvertising = $interval(function(){			
						$scope.data.secondsLeft--; 									
						if ($scope.data.secondsLeft===0) {
							$interval.cancel(intervalPromiseAdvertising);
							jsonDataPromise('/ext-api-advertising/accept-view-bonus',{id: params.id}).then(function (data){
								if(data) {
									status.update();
									$('#advertising-view-bonus-popup').kendoMobileModalView('close');
								}
							});								
						}
						
				},1000);

				ref.addEventListener('exit', function() {
					$interval.cancel(intervalPromiseAdvertising);
					intervalPromiseAdvertising = null;

				});
				
				$rootScope.$on('pause',function(event){
					$interval.cancel(intervalPromiseAdvertising);
					intervalPromiseAdvertising = null;
				});
			//});
		});
		
		$scope.data.onClose = function(kendoEvent) {
			$interval.cancel(intervalPromiseAdvertising);
			intervalPromiseAdvertising = null;
        };
	}
});