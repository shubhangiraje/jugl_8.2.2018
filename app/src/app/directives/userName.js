app.filter('userName', function() {
    return function(userObject) {
        if (!userObject)
            return '';
        return userObject.is_company_name ? userObject.company_name : (userObject.first_name||'') + ' ' + (userObject.last_name||'');
    };
});
