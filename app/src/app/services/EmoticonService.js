var emoticonService=angular.module('EmoticonService', []);

emoticonService.factory('emoticons',function($rootScope) {

    var factory={};

    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    factory.emoticonsList = [
        {
            num: 1,
            codes: [':-D',':D']
        },
        {
            num: 45,
            codes: [':)']
        },
        {
            num: 46,
            codes: [';=)']
        },
        {
            num: 2,
            codes: [';-)',';)']
        },
        {
            num: 3,
            codes: [':-)']
        },
        {
            num: 4,
            codes: ['o)','O)']
        },
        {
            num: 5,
            codes: ['<3','&amp;lt;3']
        },
        {
            num: 6,
            codes: ['3<', '3&amp;lt;']
        },
        {
            num: 7,
            codes: ['o_o','O_O']
        },
        {
            num: 8,
            codes: [':P',':p']
        },
        {
            num: 9,
            codes: [':/',':-/']
        },
        {
            num: 10,
            codes: [':#']
        },
        {
            num: 11,
            codes: [':*',':-*']
        },
        {
            num: 12,
            codes: ['><','&amp;gt;&amp;lt;']
        },
        {
            num: 13,
            codes: ['=D']
        },
        {
            num: 14,
            codes: ['x_x','X_X']
        },
        {
            num: 15,
            codes: [':|',':-|']
        },
        {
            num: 16,
            codes: ['>.<','&amp;gt;.&amp;lt;']
        },
        {
            num: 17,
            codes: ['B)','B-)']
        },
        {
            num: 38,
            codes: ['^_']
        },
        {
            num: 48,
            codes: [';(',';-(',';=(']
        },
        {
            num: 41,
            codes: ['(ok)']
        },
        {
            num: 42,
            codes: ['(y)']
        },
        {
            num: 43,
            codes: ['(n)']
        },
        {
            num: 44,
            codes: ['(highfive)']
        },
        {
            num: 47,
            codes: ['(clap)']
        },
        {
            num: 49,
            codes: ['(jugl)']
        },
        {
            num: 50,
            codes: ['(j)']
        }
    ];

    factory.emoticonsListInversion={};
    factory.emoticonsRegExp=new RegExp(
        factory.emoticonsList.map(function(emoticon) {
            return emoticon.codes.map(function(code) {
                factory.emoticonsListInversion[code]=emoticon.num;
                return escapeRegExp(code);
            }).join('|');
        }).join('|'),'g'
    );

    return factory;
});
