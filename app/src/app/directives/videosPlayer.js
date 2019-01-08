app.directive('videosPlayer', function($document,$timeout) {
    return {
        restrict: 'AC',
		scope: {
            initOnload: '@',
			data: '='
		},
        link: function(scope, element, $attrs) {
		
			var player,isInitialized;

			function initVideoPlayer(){
				if (scope.data.provider==='glomex'){
					//glomex Player
				   	$('.videos-player').glomexPlayer({
						videoId: scope.data.clip_id,
						duration: scope.data.clip_duration,
						nextVideoId: scope.data.clip_id,
						load: function() {

						},
						start: function() { },
						break: function() {  },
						stop: function() {  },
						complete: function() {
							scope.data.complete = true;
							$('.nextVideo').show();
						}
					});

					$('.nextVideo').html('<h2>'+scope.data.video_list[0].full_name+'</h2><a class="btn btn-submit" href="#/videos/details/'+scope.data.video_list[0].video_id+'">Video anschauen</a>');

				} else if (scope.data.provider==='dailymotion'){
					window.dmAsyncInit = function() {
						DM.init({ apiKey: 'aebe16247c4b812e469b', status: true, cookie: true });
						var adwatched=false;
						var endreached=false;
						var e = document.createElement('div');
						e.id="dyn_vid";
						videopl=document.getElementById('videosplayer');
						videopl.appendChild(e);

						player = DM.player(document.getElementById('dyn_vid'), {
							video: scope.data.clip_id,
							width: "100%",
							height: "500",
							params: {
								endscreen_enable : false
							}
						});

						player.addEventListener('ad_end',function (){
							adwatched = true;
							if(endreached){
								scope.data.complete = true;
							}
						});

						player.addEventListener('video_end',function (){
							endreached=true;
							if(adwatched){
								scope.data.complete = true;
							}
						});

					};

				  	(function() {
						var e = document.createElement('script');
						e.id="dailymotion-script";
						e.async = true;
						e.src = 'https://api.dmcdn.net/all.js';

						var s = document.getElementsByTagName('script')[0];
						s.parentNode.insertBefore(e, s);
					}());

				}
		
			}
			
			function destroyVideoPlayer(){
				$('#dyn_vid').remove();
				$('#dailymotion-script').remove();
				player = '';			
			}
			
			if (scope.initOnload) {
				isInitialized = false;
				return scope.$watch(function() { return scope.data; }, function(newVal, oldVal) {
					if (newVal!==false && newVal!=oldVal) {
						if (isInitialized) {
							destroyVideoPlayer();
						}
						initVideoPlayer();
						isInitialized = true;
						return isInitialized;
					} else {
						scope.data={};
					}
				});
			} else {
                return initVideoPlayer();
            }
			
        }
    };
});