app.filter('unshiftArray', [ function( $filter ) {
    return function( input, value ) {
        if (angular.isArray(input)) {
            input.unshift(value);
        }

        return input;
    };
}]);
