app.filter('default', [ '$filter', function( $filter ) {
    return function( input, defaultValue ) {
        if ( !input ) return defaultValue;
        return input;
    };
}]);
