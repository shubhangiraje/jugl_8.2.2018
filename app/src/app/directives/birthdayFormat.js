app.filter('birthdayFormat', ['$filter', function ($filter) {
    return function(date) {
        var str;

        if (!angular.isString(date)) return '';
        str = date.replace('--', '');
        return str.replace(/-/g, '.');
    };
}]);