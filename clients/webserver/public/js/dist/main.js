"use strict";

(function() {
  angular.module('GHome', ['ngRoute', 'angularFileUpload'])
    .config(function($routeProvider, $locationProvider) {
      $routeProvider
        .when('/home', { templateUrl: 'partials/home.html' })
        .when('/weather', { templateUrl: 'partials/weather.html' })
        .when('/surveillance', { templateUrl: 'partials/surveillance.html' })
        .when('/temperature', { templateUrl: 'partials/temperature.html' })
        .when('/brightness', { templateUrl: 'partials/brightness.html' })
        .when('/power', { templateUrl: 'partials/power.html' })
        .when('/modules', { templateUrl: 'partials/modules.html' })
        .when('/settings', { templateUrl: 'partials/settings.html' })
        .when('/ai-config', { templateUrl: 'partials/ai-config.html' })
        .otherwise({ redirectTo: '/home' })
      ;
    });
})();
;function MainCtrl($scope, ModuleService, HouseMapService) {
  // Module supervision (history)
  $scope.supervision = {};
  $scope.supervision.module = '';
  $scope.supervision.data = {};
  $scope.supervision.maxData = 10;
  $scope.supervision.poll = null;

  $scope.$watch('supervision.module', function() {
    // Cancel the previous poll
    if ($scope.supervision.poll) {
      $scope.supervision.poll.cancel();
      $scope.supervision.data = {};
    }

    // Do nothing if the module isn't set
    if (!$scope.supervision.module) { return; }

    // Poll the current supervised module for its status
    $scope.supervision.poll = ModuleService.pollInstances($scope.supervision.module, function(promise) {
      promise.success(function(data) {
        angular.forEach(data, function(instance) {
          var instanceName = instance.name;
          angular.forEach(instance.attrs, function(data, attr) {
            var attrName = instanceName + '.' + attr
            // Empty data case
            if (!$scope.supervision.data[attrName]) {
              $scope.supervision.data[attrName] = [];
            }

            // Push new data
            var attrData = $scope.supervision.data[attrName];
            attrData.push([instance.time, data]);
            if ($scope.supervision.maxData < attrData.length) {
              attrData.splice(0, attrData.length - $scope.supervision.maxData);
            }
          });
        });
      }).error(function() {
        // TODO
      });
    });

    // Stop polling when location is changed
    $scope.$on('$routeChangeSuccess', function () {
      $scope.supervision.poll.cancel();
      $scope.supervision.module = '';
      $scope.supervision.data = {};
      $scope.supervision.graphData = [];
    });
  });

  // Get the rooms (asynchronous)
  HouseMapService.getRooms().then(function(rooms) {
    $scope.rooms = rooms;
  });

  // House map namespace
  $scope.map = {};

  // Minimal bbox af all rooms
  $scope.map.box = {};

  // Comma-separated representation for points (x1,y1 x2,y2 x3,y3 etc...), used
  // for svg rendering.
  $scope.map.points = function(room) {
    var pointsRepr = '';
    angular.forEach(room.polygon, function(point, i) {
      // Update the points representation
      pointsRepr += point.x + ',' + point.y;
      if (i < room.polygon.length - 1) {
        pointsRepr += ' ';
      }
    });
    return pointsRepr;
  };

  // Compute map padding (relative to bbox)
  $scope.map.padding = function() {
    return $scope.map.paddingRatio*Math.max(
        $scope.map.box.maxX - $scope.map.box.minX,
        $scope.map.box.maxY - $scope.map.box.minY);
  };
  // padding = ratio*max(width, height)
  $scope.map.paddingRatio = 0.05;

  // Watch expression on rooms in order to update the bbox accordingly
  $scope.$watch('rooms', function() {
    angular.forEach($scope.rooms, function(room) {
      angular.forEach(room.polygon, function(point) {
        if      ($scope.map.box.minX === undefined || point.x < $scope.map.box.minX) { $scope.map.box.minX = point.x; }
        else if ($scope.map.box.maxX === undefined || point.x > $scope.map.box.maxX) { $scope.map.box.maxX = point.x; }
        if      ($scope.map.box.minY === undefined || point.y < $scope.map.box.minY) { $scope.map.box.minY = point.y; }
        else if ($scope.map.box.maxY === undefined || point.y > $scope.map.box.maxY) { $scope.map.box.maxY = point.y; }
      });
    });
  });
}
;function ModulesCtrl($scope, ModuleService) {
  // All modules
  $scope.modules = [];

  // Explicitly reload modules
  $scope.reloadModules = function() {
    ModuleService.all().then(function(modules) {
      $scope.modules = modules;
    });
  };
  //...and call immediately
  $scope.reloadModules();

  // Uploading system
  $scope.uploading = false
  $scope.upload = function(file) {
    $scope.uploading = true;
    $scope.upload = ModuleService.install(file).progress(function(evt) {
      $scope.uploadProgress = parseInt(100.0 * evt.loaded / evt.total);
    }).success(function() {
      $scope.uploading = false;
      $scope.reloadModules();
    }).error(function() {
      $scope.uploading = false;
      // TODO handle errors better
    });
  };

  // Toggle module visibilité/activity
  $scope.expandedModule = null;
  $scope.toggleActiveModule = function(module) {
    if ($scope.expandedModule == module) {
      $scope.expandedModule = null;
    } else {
      $scope.expandedModule = module;
    }
  };
}
;angular.module('GHome').directive('graph', function() {
  return {
    restrict: 'EA',
    link: function($scope, elem, attrs) {
      var chart = null, opts = {
        xaxis: {
          tickLength: 0
        }, yaxis: {
          tickLength: 0
        }, grid: {
          borderWidth: 0,
          aboveData: true,
          markings: [ { yaxis: { from: 0, to: 0 }, color: '#888' },
                      { xaxis: { from: 0, to: 0 }, color: '#888' }]
        }, series: {
          shadowSize: 0,
          points: {
            show: true
          }, lines: {
            show: true
          }
        }
      };

      // Actual plotting based on the graph data model
      $scope.$watch(attrs.graphModel, function(data) {
        var plottedData = [];
        if (data instanceof Array) {
          plottedData = data;
        } else {
          angular.forEach(data, function(rawData, label) {
            plottedData.push({ label: label, data: rawData });
          });
        }

        if (!chart) {
          chart = $.plot(elem, plottedData, opts);
          elem.css('display', 'block');
        } else {
          chart.setData(plottedData);
          chart.setupGrid();
          chart.draw();
        }
      }, true);
    }
  };
  });
;angular.module('GHome').directive('svgVbox', function() {
  return {
    link: function($scope, elem, attrs) {
      // Configurable viewBox padding
      var padding = 0
      attrs.$observe('svgVboxPadding', function(value) {
        if (value === undefined) { return; }
        value = parseFloat($scope.$eval(value));
        padding = value;
      });

      $scope.$watch(attrs.svgVbox, function(vbox) {
        // Default values for viewBox
        if (vbox.minX === undefined) { vbox.minX = 0; }
        if (vbox.maxX === undefined) { vbox.maxX = 0; }
        if (vbox.minY === undefined) { vbox.minY = 0; }
        if (vbox.maxY === undefined) { vbox.maxY = 0; }

        // Actual (x, y, w, h) values
        var
          x = vbox.minX - padding,
          y = vbox.minY - padding,
          w = (vbox.maxX - vbox.minX) + 2*padding,
          h = (vbox.maxY - vbox.minY) + 2*padding;

        // Update svg element
        // TODO check compatibility (jQuery/DOM)
        elem[0].setAttribute('viewBox',
          x + ' ' + y + ' ' + w + ' ' + h);
      });
    }
  };
});
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
;angular.module('GHome').factory('ModuleService', function($q, $http, $timeout, $upload) {
  var service = {
    defaultPollingDelay: 1000
  };

  service.modules = [];

  // Get the list of available modules, optionally passing if this should force
  // a reload of this list
  service.all = function(forceReload) {
    var deferred = $q.defer();
    if (!forceReload) {
      $http.get('/api/modules').success(function(data) {
        service.modules = data;
        deferred.resolve(data);
      }); // TODO handle errors
    } else {
      deferred.resolve(this.modules);
    }
    return deferred.promise;
  };

  // Poll all module instances for their statuses, passing in the module's name
  // and a callback which should be applied on a $http promise object.
  // Optionally, pass in the delay to override the service's default polling
  // delay.
  // FIXME
  service.pollInstances = function(name, callback, delay) {
    if (delay === undefined) { delay = service.defaultPollingDelay; }

    var timeout = $timeout(function pollFn() {
      callback($http.get('/api/modules/' + name + '/instances/status'));
      timeout = $timeout(pollFn, delay);
    }, delay);

    return {
      cancel: function() {
        $timeout.cancel(timeout);
      }
    };
  };

  // Install a module, passing in the uploaded file object (see $upload for
  // details). Return a promise object for the given upload http call.
  service.install = function(file) {
    return $upload.upload({
      url: '/api/modules/install',
      method: 'POST', file: file,
    });
  }

  return service;
});
