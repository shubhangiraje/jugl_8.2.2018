app.directive('selectr', function($timeout) {
  	return {
		restrict: 'EAC',
		scope: {
				initOnload: '@',
				data: '=',
				options:'=',
				model:'=',
				label:'='
			
    	},
    	link: function(scope,element,attr) {
	
			var isInitialized,chosen_elements,option_list;

			function initSelectr(){}
			function update(){}
 			function add_element(id){}
			function remove_element(id){}
			function destroySelectr(){}

			if (scope.initOnload) {
				isInitialized = false;
				return scope.$watch(function() {
					return scope.model;
				}, function(newVal, oldVal) {
					if (newVal!=oldVal) {
						if (isInitialized) {
							destroySelectr();
						}
						initSelectr();
						isInitialized = true;
						return isInitialized;
					}
				});
			}
		}
  	};
});