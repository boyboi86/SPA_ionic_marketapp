angular.module('newApp.services', [])

.factory('stockDataService', function($q, $http){
/*Non-pricing ticker */
var getDetailsData = function(ticker) {
  //http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20IN%20(%22YHOO%22)&format=json&env=http://datatables.org/alltables.env
  var deferred = $q.defer();
  var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20IN%20(%22"+ ticker +"%22)&format=json&env=http://datatables.org/alltables.env"

  $http.get(url)
    .success(function(json){
      jsonData = json.query.results.quote;
      deferred.resolve(jsonData);
    })
    .error(function(err){
      console.log('Details error ', err);
      deferred.reject();
    })

    return deferred.promise;
};

/*Pricing related details*/
var getPriceData = function(ticker){

  var deferred = $q.defer();
  var url = "http://finance.yahoo.com/webservice/v1/symbols/" + ticker + "/quote?bypass=true&format=json&view=detail";

  $http.get(url)
    .success(function(json){
      jsonData = json.list.resources[0].resource.fields;
      deferred.resolve(jsonData);
    })
    .error(function(err){
      console.log('Price error ', err);
      deferred.reject();
    })

    return deferred.promise;
};


  return {
    getPriceData: getPriceData,
    getDetailsData: getDetailsData
  };
});
