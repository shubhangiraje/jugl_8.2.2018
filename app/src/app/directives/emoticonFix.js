app.filter('emoticonFixMobile', function($filter,emoticons) {
    return function(message, useIconXL) {

        if (message) {
            var useLargeIcons=false;

            var iconsLeft=5;
            var afterIconsCut=message.replace(emoticons.emoticonsRegExp, function(matched) {
                if (iconsLeft>0) {
                    iconsLeft--;
                    return '';
                } else {
                    return matched;
                }
            });

            if (afterIconsCut.replace(/\s+/g,'')==='') {
                useLargeIcons=true;
            }

            var escapedMessage = $('<div/>').text(message).html();

            escapedMessage = $filter('linky')(escapedMessage);
            escapedMessage = escapedMessage.split(/(<a[^>]*>[^<]*<\/a>)/);

            var replaceCallback=function(matched) {
                var emoticon = emoticons.emoticonsListInversion[matched] || '';
                if (!emoticon)
                    return '';

                if(useIconXL) {
                    return '<span class="smiles-sprite smile-'+(useLargeIcons ? 'xl':'lg')+' smile-'+ emoticon + '"></span>';
                } else {
                    return '<span class="smiles-sprite smile-lg smile-'+ emoticon + '"></span>';
                }

            };

            var res ='';
            for(var i=0; i<escapedMessage.length; i++) {
                if(i%2===0) {
                    res = escapedMessage[i].replace(emoticons.emoticonsRegExp, replaceCallback);
                    escapedMessage[i] = res;
                }
            }

            return escapedMessage.join('');

            //return escapedMessage.replace(chatCtrl.emoticonsRegExp, function(matched) {
            //    var emoticon = chatCtrl.emoticonsListInversion[matched] || '';
            //    if (!emoticon)
            //        return '';
            //    return '<span class="smiles-sprite smile-lg smile-'+ emoticon + '"></span>';
            //});
        }

    };
});

app.filter('trustAsHtml',function($sce) {
    return function(html) {
        return $sce.trustAsHtml(html);
    };
});
