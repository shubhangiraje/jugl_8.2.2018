app.directive('streamPlayVideo', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        link: function ($scope, element, $attrs) {
            console.log('init play');
            var token = "null";
            var streamId = 'streamApp';
            var remoteVideoId = element.find('video').attr('id');

            var startPlaying = element.find('#start-playing');
            var stopPlaying = element.find('#stop-playing');

            startPlaying.on('click', function() {
                webRTCAdaptor.play(streamId/*, token*/);
            });

            stopPlaying.on('click', function() {
                webRTCAdaptor.stop(streamId);
            });


            var pc_config = null;

            var sdpConstraints = {
                OfferToReceiveAudio : true,
                OfferToReceiveVideo : true
            };

            var mediaConstraints = {
                video : false,
                audio : false
            };

            var websocketURL = "wss://s.jugl.net:5443/WebRTCAppEE/websocket";

            var webRTCAdaptor = new WebRTCAdaptor({
                websocket_url : websocketURL,
                mediaConstraints : mediaConstraints,
                peerconnection_config : pc_config,
                sdp_constraints : sdpConstraints,
                remoteVideoId : remoteVideoId,
                isPlayMode: true,
                debug:false,
                callback : function(info, description) {
                    if (info == "initialized") {
                        console.log("initialized");
                        webRTCAdaptor.play(streamId);
                    } else if (info == "play_started") {
                        console.log("play started");
                    } else if (info == "play_finished") {
                        console.log("play finished");
                    } else if (info == "closed") {
                        if (typeof description != "undefined") {
                            console.log("Connecton closed: " + JSON.stringify(description));
                        }
                    }
                },
                callbackError : function(error) {
                    console.log("error callback: " + JSON.stringify(error));
                    alert(JSON.stringify(error));
                }
            });

        }
    };
});