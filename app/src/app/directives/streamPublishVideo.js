app.directive('streamPublishVideo', function($timeout, $rootScope) {
    return {
        restrict: 'A',
        link: function ($scope, element, $attrs) {
            var token = "null";
            var streamId = 'streamApp';
            var localVideoId = element.find('video').attr('id');

            var startPublishing = element.find('#start-publishing');
            var stopPublishing = element.find('#stop-publishing');

            startPublishing.on('click', function() {
                webRTCAdaptor.publish(streamId/*, token*/);
            });

            stopPublishing.on('click', function() {
                webRTCAdaptor.stop(streamId);
            });

            var pc_config = null;

            var sdpConstraints = {
                OfferToReceiveAudio : false,
                OfferToReceiveVideo : false
            };

            var mediaConstraints = {
                video : true,
                audio : true
            };

            var websocketURL = "wss://s.jugl.net:5443/WebRTCAppEE/websocket";
            var webRTCAdaptor;

            $timeout(function () {
                console.log('timeout passed');
                webRTCAdaptor = new WebRTCAdaptor({
                    websocket_url : websocketURL,
                    mediaConstraints : mediaConstraints,
                    peerconnection_config : pc_config,
                    sdp_constraints : sdpConstraints,
                    localVideoId : localVideoId,
                    debug:true,
                    callback : function(info, description) {
                        console.log('info: '+info);
                        console.log('description: ');
                        console.log(angular.copy(description));
                    },
                    callbackError : function(error, message) {

                        console.log("error callback: " +  JSON.stringify(error));
                        console.log(message);
                        var errorMessage = JSON.stringify(error);

                        if (typeof message != "undefined") {
                            errorMessage = message;
                        }

                        if (error.indexOf("NotFoundError") != -1) {
                            errorMessage = "Camera or Mic are not found or not allowed in your device";
                        }
                        else if (error.indexOf("NotReadableError") != -1 || error.indexOf("TrackStartError") != -1) {
                            errorMessage = "Camera or Mic is being used by some other process that does not let read the devices";
                        }
                        else if(error.indexOf("OverconstrainedError") != -1 || error.indexOf("ConstraintNotSatisfiedError") != -1) {
                            errorMessage = "There is no device found that fits your video and audio constraints. You may change video and audio constraints";
                        }
                        else if (error.indexOf("NotAllowedError") != -1 || error.indexOf("PermissionDeniedError") != -1) {
                            errorMessage = "You are not allowed to access camera and mic.";
                        }
                        else if (error.indexOf("TypeError") != -1) {
                            errorMessage = "Video/Audio is required";
                        }

                        alert(errorMessage);
                    }
                });
            });
        }
    };
});