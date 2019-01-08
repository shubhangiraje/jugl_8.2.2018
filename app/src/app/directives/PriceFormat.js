app.filter('priceFormat', function() {

    function formatNumber(number,digits,thousands_sep,decimal_sep) {

        /*
        function toFixed(num, fixed) {
            if (fixed===null) return num+"";
            fixed = fixed || 0;
            var pow = Math.pow(10, fixed);
            return (Math.floor(num * pow) / pow).toFixed(fixed);
        }
        */


        // limit max number of digits
        function toFixed(number,digits) {
            if (digits===null) return number+"";
            return number.toFixed(digits);
        }


        if (typeof thousands_sep === 'undefined') thousands_sep=' ';
        if (typeof decimal_sep === 'undefined') decimal_sep=',';

        var integerPart = parseInt(toFixed(Math.abs(+number || 0),digits)) + "";
        var thousandsGroups = (integerPart.length) > 3 ? integerPart.length % 3 : 0;

        var fraction;
        var fractionPart=Math.abs(number - integerPart)+1e-6;

        if (digits===null) {
            // take not more than 6 fractional digits
            fraction=toFixed(fractionPart,6).slice(2).replace(/0+$/,'');
        } else {
            fraction=toFixed(fractionPart,digits).slice(2)/*.replace(/0+$/,'')*/;
        }

        price= number < 0 ? "-" : "" +
        (thousandsGroups ? integerPart.substr(0, thousandsGroups) + thousands_sep : "") +
        integerPart.substr(thousandsGroups).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep) +
        (fraction ? decimal_sep + fraction : "");

        return price;
    }

    return function(price) {
        price=Math.abs(price);
        if (isNaN(price)) return '';

        var res;

        if (price-Math.floor(price)>=0.01) {
            res=formatNumber(price,2,'.',',');
        } else {
            res=formatNumber(price,0,'.',',');
        }

        return res;
    };
});
