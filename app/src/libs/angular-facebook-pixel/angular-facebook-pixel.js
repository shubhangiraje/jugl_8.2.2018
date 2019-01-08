(function(angular) {
	'use strict';
	angular.module('ps-facebook-pixel', [])
		.provider('$pixel', function() {
			var $pixelProvider = {
				currency: 'TWD',
				setCurrency: setCurrency,
				setId: setId,
				$get: Pixel
			};
			return $pixelProvider;

			function init() {
				!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

				fbq.disablePushState = !!$pixelProvider.disablePushState;
				fbq('init', $pixelProvider.id);
				if (!$pixelProvider.delayPageView) fbq('track', 'PageView');
			}

			function setId(id) {
				$pixelProvider.id = id;
			}

			function setCurrency(currency) {
				$pixelProvider.currency = currency;
			}

			function Pixel() {
				var $pixel = {
					pageView: pageView,
					purchase: purchase,
					track: track
				};

				init();
				return $pixel;

				function pageView() {
					fbq('track', 'PageView');
				}

				function purchase(val) {
					var params = angular.isObject(val) ? val : {
						value: val
					};
					if (!params.currency) params.currency = $pixelProvider.currency;
					fbq('track', 'Purchase', params);
				}

				function track(event, params) {
					fbq('track', event, params);
				}
			}
		});
})(angular);