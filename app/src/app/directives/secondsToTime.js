app.filter('secondsToTime', [function() {
    return function(seconds) {
        var hours = Math.floor((seconds % 86400) / 3600);
        var mins = Math.floor(((seconds % 86400) % 3600) / 60);
        var secs = ((seconds % 86400) % 3600) % 60;
        return (hours>0 ? ('00'+hours).slice(-2) +':' : '') + ('00'+mins).slice(-2)+':' + ('00'+secs).slice(-2);
    };
}]);