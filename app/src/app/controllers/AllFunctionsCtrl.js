app.controller('AllFunctionsCtrl', function ($scope,$timeout,modal,gettextCatalog) {

    if (!$scope.data) {

        $scope.data = {};

        $scope.data.accountDelete =function() {
            modal.alert({'message':gettextCatalog.getString('Um Dein Profil zu löschen, stelle bitte einen schriftlichen Antrag auf Löschung mit der eMail Adresse mit der Du Dich registriert hast. Bitte mit Vor- und Nachnamen, vollständiger Anschrift und deiner Unterschrift an juglapp@gmx.de. Wir bitten um Verständnis, dass wir dies fordern, um Missbrauch zu vermeiden.')});
        };

    }

});



