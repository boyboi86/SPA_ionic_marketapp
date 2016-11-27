angular.module('newApp.services', [])

.factory('encodeURIService', function() {
  return {
    encode: function(string){
      console.log(string)
      return encodeURIComponent(string).replace(/\"/g, "%22").replace(/\ /g, "%20").replace(/[!'()]/g, escape);
    }
  }
})

.factory('dateService', function($filter){

  var currentDate = function() {
    var d = new Date();
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  }

  var oneYearAgoDate = function(){
    var y = new Date().setDate(new Date().getDate() - 365);
    var d = new Date(y);
    var date = $filter('date')(d, 'yyyy-MM-dd');
    return date;
  }

  return {
    currentDate: currentDate,
    oneYearAgoDate: oneYearAgoDate
  }
})

.factory('stockDataService', function($q, $http, encodeURIService){
/*Non-pricing ticker */
var getDetailsData = function(ticker) {
  //http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20IN%20(%22YHOO%22)&format=json&env=http://datatables.org/alltables.env
  var deferred = $q.defer();
  /*The below query is used for YQL only*/
  query = 'select * from yahoo.finance.quotes where symbol IN ("' + ticker + '")',
  url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';

  console.log(url)

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
