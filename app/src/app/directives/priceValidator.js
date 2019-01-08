function formatNumber(number,digits,thousands_sep,decimal_sep) {

    // limit max number of digits
    function toFixed(number,digits) {
        if (digits===null) return number+"";
        return number.toFixed(digits);
    }

    if (typeof thousands_sep === 'undefined') thousands_sep='.';
    if (typeof decimal_sep === 'undefined') decimal_sep=',';

    var integerPart = parseInt(number = toFixed(Math.abs(+number || 0),digits)) + "";
    var thousandsGroups = (integerPart.length) > 3 ? integerPart.length % 3 : 0;

    var fraction;

    if (digits===null) {
        // take not more than 6 fractional digits
        fraction=toFixed(Math.abs(number - integerPart),2).slice(2).replace(/0+$/,'');
    } else {
        fraction=toFixed(Math.abs(number - integerPart),digits).slice(2).replace(/0+$/,'');
    }

    price= number < 0 ? "-" : "" +
    (thousandsGroups ? integerPart.substr(0, thousandsGroups) + thousands_sep : "") +
    integerPart.substr(thousandsGroups).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep) +
    (fraction ? decimal_sep + fraction : "");

    return price;
}

app.directive('priceValidator', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {
                /*
                var transformedInput = viewValue.replace(/[^0-9,.]/g, '');
                if (transformedInput!=viewValue) {
                    ctrl.$setViewValue(transformedInput);
                    viewValue=transformedInput;
                    ctrl.$render();
                }
                */

                var value=viewValue;
                // for input type number this is not neccessary
                //value=viewValue.replace('.','').replace(',','.');

                if (!isNaN(+value)) {
                    ctrl.$setValidity('priceValidator', true);
                    return +value;
                } else {
                    ctrl.$setValidity('priceValidator', true);
                    return viewValue;
                }
            });
            ctrl.$formatters.unshift(function(modelValue) {
                var val=+modelValue;

                if (isNaN(val) || modelValue===null || modelValue==='') return modelValue;

                return formatNumber(val,null);
            });
        }
    };
});
