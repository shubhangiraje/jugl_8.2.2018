app.directive('timeCountdown', function($interval,serverTime) {
    return {
        restrict: 'A',

        link: function(scope, element, $attrs) {

            function getTimeFormat(time) {
                if (time<0) {
                    time=0;
                }

                var seconds=time%60;
                if (seconds<10) seconds='0'+seconds;
                time=Math.floor(time/60);

                var minutes=time%60;
                if (minutes<10) minutes='0'+minutes;
                time=Math.floor(time/60);

                var res = time+':'+minutes+':'+seconds;
                return res;
            }

            function update() {
                if(scope.$eval($attrs.timeCountdown)!==0) {
                    var endTime=(new Date(scope.$eval($attrs.timeCountdown))).getTime();
                    var left=Math.ceil((serverTime.getCurrentServerTime()-endTime)/1000);
                    var leftTime = 86400-left;
                    var str = getTimeFormat(leftTime);
                    element.html(str);
                } else {
                    element.html('');
                }
            }

            update();
            $interval(update,1000);

        }


    };
});
