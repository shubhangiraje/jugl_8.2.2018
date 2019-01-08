app.directive('emoticonsTooltip', function($document, $rootScope, emoticons) {
    return {
        restrict: 'A',
        scope: {
            emoticonsList: '=',
            messageText: '='
        },
        link: function(scope, element, $attrs) {
            var $tooltip = $('<div class="emoticons-tooltip">');
            var $textarea = $(element).parent().find('textarea');

            if($attrs.emoticonsForum) {
                var parentForumForm = $(element).closest('.jugl-forum-send-box');
                $textarea = parentForumForm.find('textarea');
            }

            emoticons.emoticonsList.map(function(emoticon) {
                $('<span class="smiles-sprite smile-lg smile-'+ emoticon.num + '"></span>').attr('data-icon-text',emoticon.codes[0]).appendTo($tooltip);
            });
            $(element).html($tooltip);
            var $icons = $('.smiles-sprite', $tooltip);

            function showEmoticonsTooltip(event) {
                $tooltip.toggle();
                var stopPropagation = event.stopPropagation ? event.stopPropagation() : (event.cancelBubble=true);
            }

            function documentClick() {
                $tooltip.hide();
            }

            function emoticonClick(event) {
                var iconText = $(this).data('icon-text') || '';

                $rootScope.$apply(function() {
                    $textarea.insertAtCaret(iconText);
                    scope.messageText = $textarea.val();
                });

                event.preventDefault();

                if (event.stopPropagation) {
                    event.stopPropagation();
                } else {
                    event.cancelBubble=true;
                }
                $tooltip.hide();
                return false;
            }

            $(element).bind('click', showEmoticonsTooltip);
            $document.bind('click', documentClick);
            $icons.bind('click', emoticonClick);

            scope.$on('$destroy',function() {
                $(element).unbind('click', showEmoticonsTooltip);
                $document.unbind('click', documentClick);
                $icons.unbind('click', emoticonClick);
            });

        }
    };
});

(function($) {
    $.fn.extend({
        insertAtCaret: function(myValue){
            return this.each(function(i) {
                if (document.selection) {
                    //For browsers like Internet Explorer
                    this.focus();
                    var sel = document.selection.createRange();
                    sel.text = myValue;
                    this.focus();
                }
                else if (this.selectionStart || this.selectionStart == '0') {
                    //For browsers like Firefox and Webkit based
                    var startPos = this.selectionStart;
                    var endPos = this.selectionEnd;
                    var scrollTop = this.scrollTop;
                    this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
                    this.focus();
                    this.selectionStart = startPos + myValue.length;
                    this.selectionEnd = startPos + myValue.length;
                    this.scrollTop = scrollTop;
                } else {
                    this.value += myValue;
                    this.focus();
                }
            });
        }
    });
})(jQuery);
