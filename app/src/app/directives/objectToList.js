app.filter('objectToList', function() {
    return function(obj) {
        if (!angular.isObject(obj)) return [];
        return $.map(obj, function(value, index) {
            return [value];
        });
    };
});
