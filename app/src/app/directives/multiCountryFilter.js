app.filter('multiCountryFilter', function(){

return function (input,selected,$nested) {
	
	var filtered = [];
	if(!$nested){
		angular.forEach(input,function(item, index) {		
			angular.forEach(selected,function(selItem, selIndex){
				if (item.country_id === selItem.id && selItem.id !== null && selItem.id !== undefined) {
					filtered.push(item);
				}				
			});
			
		});
	}
	else{
		angular.forEach(input,function(item, index) {		
			angular.forEach(selected,function(selItem, selIndex){
				if (item.user.country_id === selItem.id && selItem.id!==null && selItem.id!==undefined) {
					filtered.push(item);
				}
			});
			
		});
	}
	return filtered;
	
	
	
   

   /*for (var i = 0; i < items.length; i++) {
      var item = items[i];
	
      if (item.user.country_id==selectboxValue && item.user.country_id!=null && selectboxValue!=null) {
        filtered.push(item);
      }
	  else if(selectboxValue==null||selectboxValue==undefined){
	  filtered.push(item);
	  }

    }
    return filtered;*/
  };
});