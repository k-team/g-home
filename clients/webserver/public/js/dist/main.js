"use strict";

(function() {
  angular.module('GHome', ['ngRoute'])
    .config(function($routeProvider, $locationProvider) {
      $routeProvider
        .when('/home', { templateUrl: 'partials/home.html' })
        .when('/weather', { templateUrl: 'partials/weather.html' })
        .when('/surveillance', { templateUrl: 'partials/surveillance.html' })
        .when('/temperature', { templateUrl: 'partials/temperature.html' })
        .when('/brightness', { templateUrl: 'partials/brightness.html' })
        .when('/camera', { templateUrl: 'partials/camera.html' })
        .when('/power', { templateUrl: 'partials/power.html' })
        .when('/music', { templateUrl: 'partials/music.html' })
        .when('/module-config', { templateUrl: 'partials/module-config.html' })
        .when('/ai-config', { templateUrl: 'partials/ai-config.html' })
        .otherwise({ redirectTo: '/home' })
      ;
    });
})();
;function HouseMapCtrl($scope, HouseMapService) {
  // Minimal bbox used for svg display
  $scope.minX = 0;
  $scope.minY = 0;
  $scope.maxX = 0;
  $scope.maxY = 0;

  // Get the rooms (asynchronous)
  HouseMapService.getRooms().then(function(rooms) {
    $scope.rooms = rooms;
  });

  $scope.polygonPoints = function(polygon) {
    var pointsRepr = '';
    angular.forEach(polygon, function(point, i) {
      // Update min/max coordinates
      if (point.x < $scope.minX) { $scope.minX = point.x; }
      else if (point.x > $scope.maxX) { $scope.maxX = point.x; }
      if (point.y < $scope.minY) { $scope.minY = point.y; }
      else if (point.y > $scope.maxY) { $scope.maxY = point.y; }

      // Update the points representation
      pointsRepr += point.x + ',' + point.y;
      if (i < polygon.length - 1) {
        pointsRepr += ' ';
      }
    });
    return pointsRepr;
  };
}
;angular.module('GHome').factory('HouseMapService', function($q, $timeout, $http) {
  var service = {};

  // Replace with an AJAX call
  service.getRooms = function() {
    var deferred = $q.defer();
    $http.get('/api/rooms').success(function(rooms) {
      deferred.resolve(rooms);
    });
    return deferred.promise;
  };
  return service;
});
