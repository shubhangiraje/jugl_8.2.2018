app.directive('serverCountdown', function($interval,serverTime) {
    return {
        restrict: 'A',

        link: function(scope, element, $attrs) {

            function getTimeFormat(time) {
                if (time<0) {
                    time=0;
                }

                var withDays=scope.$eval($attrs.serverCountdownWithDays);

                var seconds=time%60;
                if (seconds<10) seconds='0'+seconds;
                time=Math.floor(time/60);

                var minutes=time%60;
                if (minutes<10) minutes='0'+minutes;
                time=Math.floor(time/60);

                var res;
                if (withDays) {
                    var hours=time%24;
                    if (hours<10) hours='0'+hours;
                    time=Math.floor(time/24);

                    if (time<10) time='0'+time;

                    res = time+' : '+hours+' : '+minutes+' : '+seconds;
                } else {
                    res = time+' : '+minutes+' : '+seconds;
                }

                return res;
            }

            function update() {
                var endTime=(new Date(scope.$eval($attrs.serverCountdown))).getTime();
                var left=Math.ceil((endTime-serverTime.getCurrentServerTime())/1000);
                var str = getTimeFormat(left);
                element.html(str);
            }

            function getTimeAccepted() {
                var timeAccepted = Math.ceil(((new Date(scope.$eval($attrs.serverCountdown))).getTime() - (new Date(scope.$eval($attrs.serverCountdownClosedDt))).getTime())/1000);
                var str = getTimeFormat(timeAccepted);
                element.html(str);
            }


            if($attrs.serverCountdownClosedDt) {
                getTimeAccepted();
            } else {
                update();
                $interval(update,1000);
            }


        }


    };
});
