angular.module('newApp.services', [])

.factory('encodeURIService', function() {
  return {
    encode: function(string){
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

.factory('chartDataCacheService', function(CacheFactory) {

  var chartDataCache;

  if(!CacheFactory.get('chartDataCache')) {

    chartDataCache = CacheFactory('chartDataCache', {
      maxAge: 60 * 60 * 8 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }
  else {
    chartDataCache = CacheFactory.get('chartDataCache');
  }

  return chartDataCache;
})

.factory('stockDataService', function($q, $http, encodeURIService, stockDetailsCacheService){
/*Non-pricing ticker */
var getDetailsData = function(ticker) {
  //http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%20IN%20(%22YHOO%22)&format=json&env=http://datatables.org/alltables.env
  var deferred = $q.defer();

  var cacheKey = ticker;
  var stockDetailsCache = stockDetailsCacheService.get(cacheKey);
  /*The below query is used for YQL only*/
  query = 'select * from yahoo.finance.quotes where symbol IN ("' + ticker + '")',
  url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';

  if(stockDetailsCache) {
      deferred.resolve(stockDetailsCache);
    } else
    { $http.get(url)
    .success(function(json){
      jsonData = json.query.results.quote;
      deferred.resolve(jsonData);
      stockDetailsCacheService.put(cacheKey, jsonData);
    })
    .error(function(err){
      console.log('Details error ', err);
      deferred.reject();
    })
  }
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
})

.factory('stockDetailsCacheService', function(CacheFactory) {

  var stockDetailsCache;

  if(!CacheFactory.get('stockDetailsCache')) {
    stockDetailsCache = CacheFactory('stockDetailsCache', {
      maxAge: 60 * 1000,
      deleteOnExpire: 'aggressive',
      storageMode: 'localStorage'
    });
  }
  else {
    stockDetailsCache = CacheFactory.get('stockDetailsCache');
  }

  return stockDetailsCache;
})

.factory("chartDataService", function($q, $http, encodeURIService, chartDataCacheService){

  var getHistoricalData = function(ticker, fromDate, todayDate){

    var deferred = $q.defer();

    var cacheKey = ticker;
    var chartDataCache = chartDataCacheService.get(cacheKey);

     var query = 'select * from yahoo.finance.historicaldata where symbol = "' + ticker + '" and startDate = "' + fromDate + '" and endDate = "' + todayDate + '"';
     var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIService.encode(query) + '&format=json&env=http://datatables.org/alltables.env';

     if(chartDataCache) {
        deferred.resolve(chartDataCache);
      } else
        { $http.get(url)
       .success(function(json){
         var jsonData = json.query.results.quote;

           var priceData = [],
           volumeData = [];

           jsonData.forEach(function(dayDataObject) {

             var dateToMillis = dayDataObject.Date,
             date = Date.parse(dateToMillis),
             price = parseFloat(Math.round(dayDataObject.Close * 100) / 100).toFixed(3),
             volume = dayDataObject.Volume,

             volumeDatum = '[' + date + ',' + volume + ']',
             priceDatum = '[' + date + ',' + price + ']';

             volumeData.unshift(volumeDatum);
             priceData.unshift(priceDatum);
           });

           var formattedChartData =
             '[{' +
               '"key":' + '"volume",' +
               '"bar":' + 'true,' +
               '"values":' + '[' + volumeData + ']' +
             '},' +
             '{' +
               '"key":' + '"' + ticker + '",' +
               '"values":' + '[' + priceData + ']' +
             '}]';

           deferred.resolve(formattedChartData);
           chartDataCacheService.put(cacheKey, formattedChartData);
       })
       .error(function(error){
         console.log('Chart Data Error: ', error);
         deferred.reject();
       });
     }
       return deferred.promise;
  };

  return {
    getHistoricalData:getHistoricalData
  }
})

.factory('notesCacheService', function(CacheFactory) {

  var notesCache;

  if(!CacheFactory.get('notesCache')) {
    notesCache = CacheFactory('notesCache', {
      storageMode: 'localStorage'
    });
  }
  else {
    notesCache = CacheFactory.get('notesCache');
  }

  return notesCache;
})

.factory('notesService', function(notesCacheService) {

  return {

    getNotes: function(ticker) {
      return notesCacheService.get(ticker);
    },

    addNote: function(ticker, note) {

      var stockNotes = [];

      if(notesCacheService.get(ticker)) {
        stockNotes = notesCacheService.get(ticker);
        stockNotes.push(note);
      }
      else {
        stockNotes.push(note);
      }

      notesCacheService.put(ticker, stockNotes);

      // if(userService.getUser()) {
      //   var notes = notesCacheService.get(ticker);
      //   userService.updateNotes(ticker, stockNotes);
      // }
    },

    deleteNote: function(ticker, index) {

      var stockNotes = [];

      stockNotes = notesCacheService.get(ticker);
      stockNotes.splice(index, 1);
      notesCacheService.put(ticker, stockNotes);

      // if(userService.getUser()) {
      //   var notes = notesCacheService.get(ticker);
      //   userService.updateNotes(ticker, stockNotes);
      // }
    }
  };
})

.factory('newsService', function($q, $http) {

  return {

    getNews: function(ticker) {

      var deferred = $q.defer(),

      x2js = new X2JS(),

      url = "http://finance.yaho.com/rss/headline?s=" + ticker;

      $http.get(url)
        .success(function(xml) {
          var xmlDoc = x2js.parseXmlString(xml),
          json = x2js.xml2json(xmlDoc),
          jsonData = json.rss.channel.item;
          deferred.resolve(jsonData);
        })
        .error(function(error) {
          deferred.reject();
          console.log("News error: " + error);
        });

      return deferred.promise;
    }
  };
})

.factory('fillMyStocksCacheService', function(CacheFactory) {

  var myStocksCache;

  if(!CacheFactory.get('myStocksCache')) {
    myStocksCache = CacheFactory('myStocksCache', {
      storageMode: 'localStorage'
    });
  }
  else {
    myStocksCache = CacheFactory.get('myStocksCache');
  }

  var fillMyStocksCache = function() {

    var myStocksArray = [
      {ticker: "AAPL"},
      {ticker: "GPRO"},
      {ticker: "FB"},
      {ticker: "NFLX"},
      {ticker: "TSLA"},
      {ticker: "BRK-A"},
      {ticker: "INTC"},
      {ticker: "MSFT"},
      {ticker: "GE"},
      {ticker: "BAC"},
      {ticker: "C"},
      {ticker: "T"}
    ];

    myStocksCache.put('myStocks', myStocksArray);
  };

  return {
    fillMyStocksCache: fillMyStocksCache
  };
})

.factory('myStocksCacheService', function(CacheFactory) {

  var myStocksCache = CacheFactory.get('myStocksCache');

  return myStocksCache;
})


.factory('myStocksArrayService', function(fillMyStocksCacheService, myStocksCacheService) {

  if(!myStocksCacheService.info('myStocks')) {
    fillMyStocksCacheService.fillMyStocksCache();
  }

  var myStocks = myStocksCacheService.get('myStocks');

  return myStocks;
})

.factory('followStockService', function(myStocksArrayService, myStocksCacheService) {

  return {

    follow: function(ticker) {

      var stockToAdd = {"ticker": ticker};

      myStocksArrayService.push(stockToAdd);
      myStocksCacheService.put('myStocks', myStocksArrayService);

      // if(userService.getUser()) {
      //   userService.updateStocks(myStocksArrayService);
      // }
    },

    unfollow: function(ticker) {

      for (var i = 0; i < myStocksArrayService.length; i++) {
        if(myStocksArrayService[i].ticker == ticker) {

          myStocksArrayService.splice(i, 1);
          myStocksCacheService.remove('myStocks');
          myStocksCacheService.put('myStocks', myStocksArrayService);

          // if(userService.getUser()) {
          //   userService.updateStocks(myStocksArrayService);
          // }

          break;
        }
      }
    },

    checkFollowing: function(ticker) {

      for (var i = 0; i < myStocksArrayService.length; i++) {
        if(myStocksArrayService[i].ticker == ticker) {
          return true;
        }
      }

      return false;
    }
  };
})
