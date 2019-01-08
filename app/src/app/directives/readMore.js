app.directive('readMore', function($timeout) {
  	return {
    	restrict: 'A',
    	scope: {
			initOnload: '@',
			data: '='
    	},
    	link: function(scope, element) {
	
			var fullText,isInitialized;
		
			function initReadMore(){
				fullText="";
				fullText=scope.data;
				if(String(fullText).length > 100) {
					var truncatedText = "<span class='readmorecontainer'>"+fullText.substr(0,100)+"<p class='readmore_btn'>... mehr anzeigen</p></span>";
					element.append(truncatedText);
					fullText="<span class='hidden_fulltextcontainer'>"+fullText+"<p class='readless_btn'>... weniger anzeigen</p></span>";
				} else{
					fullText="<span class='fulltext'>"+fullText+"</span>";
				}

				element.append(fullText);
				element.find('.hidden_fulltextcontainer').hide();

				element.find('.readmore_btn').on('click', function() {
					element.find('.readmorecontainer').hide();
					element.find('.hidden_fulltextcontainer').show();
				});

				element.find('.readless_btn').on('click', function() {
					element.find('.hidden_fulltextcontainer').hide();
					element.find('.readmorecontainer').show();
				});
			}
		
			function destroyReadMore(){
				element.find('.fulltext').remove();
				element.find('.readmorecontainer').remove();
				element.find('.hidden_fulltextcontainer').remove();
				fullText="";
			}
		

			if (scope.initOnload) {
				isInitialized = false;
				return scope.$watch(function() { return scope.data; }, function(newVal, oldVal) {
					if (newVal!==false && newVal!=oldVal) {
						if (isInitialized) {
							destroyReadMore();
						}
						initReadMore();
						isInitialized = true;
						return isInitialized;
					} else {
						scope.data='';
					}
				});
			} else {
                return initReadMore();
            }



		}
  	};
});