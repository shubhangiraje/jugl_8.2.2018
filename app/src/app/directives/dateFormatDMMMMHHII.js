app.filter('dateFormatDMMMMHHII', [ '$filter', function( $filter ) {
    return function( input ) {
        var months=[
            'Januar',
            'Februar',
            'Marz',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'December'
        ];

        var date=new Date(input);

        return date.getDate()+' '+months[date.getMonth()]+' um '+date.getHours()+':'+(date.getMinutes()<10 ? '0':'')+date.getMinutes();
    };
}]);
