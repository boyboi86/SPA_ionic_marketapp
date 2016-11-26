angular.module('newApp.services', [])

.factory('stockDataService', function($q, $http){

var getPriceData = function(){

  var deferred = $q.defer();
  var url = "http://finance.yahoo.com/webservice/v1/symbols/YHOO/quote?bypass=true&format=json&view=detail";

  $http.get("http://finance.yahoo.com/webservice/v1/symbols/YHOO/quote?bypass=true&format=json&view=detail")
    .then(function(jsonData){
      console.log(jsonData.data.list.resources[0].resource.fields);
    });

};


  return {
    getPriceData: getPriceData
  };
});
