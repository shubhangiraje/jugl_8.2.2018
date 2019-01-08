app.directive('modal', function($timeout, $rootScope, status, $log) {

    return {
        restrict: 'A',
        link: function($scope, element, $attrs) {

            var modalviewRoot = element.closest('.km-modalview-root');

            if($attrs.modalTop) {
                modalviewRoot.css({
                    'z-index':'10002'
                });
            }

            if($attrs.modalPhotoSwipe) {
                modalviewRoot.addClass('modalview-root-photo-swipe-popup');
                $('.photo-swipe-popup').css({
                    'height':$(window).height()+'px'
                });
            }

            if($attrs.modalTrollboxMessageUpdate) {
                modalviewRoot.addClass('modalview-trollbox-message-update-popup');
            }

            var closeBtn = element.find('.closeModalBtn');
            closeBtn.on('click', function () {
                element.kendoMobileModalView("close");

                if($attrs.thisIsPopup == 'start-popup') {
                    $rootScope.showFriendsPopup();
                }
            });

        }

    };

});