angular.module('GHome').factory('ModuleService', function($q, $http, $timeout, $upload) {
  var service = {},
    modulesUrl = '/api/modules',
    storeUrl = '/api/available_modules';

  var httpPostJSON = function(url, data) {
    var deferred = $q.defer();
    console.log(data);

    // Format data for POST
    var formattedData = '';
    for (var key in data) {
      var v = data[key];
      if (v === true)
        v = 'true';
      else if (v === false)
        v = '';
      formattedData += key + '=' + v + '&';
    }
    formattedData = formattedData.substring(0, formattedData.length-1);
    console.log(formattedData);

    // Send HTTP request
    $http({
      url: url, method: 'POST', data: formattedData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).success(function(data) {
      deferred.resolve(data);
    }).error(function() {
      deferred.reject();
    });

    return deferred.promise;
  };

  var httpGetJSON = function(url) {
    var deferred = $q.defer();
    $http.get(url)
      .success(function(data) { deferred.resolve(data); })
      .error(function() { deferred.reject(); });
    return deferred.promise;
  };

  service.module = function(name) {
    return httpGetJSON(modulesUrl + '/' + name);
  };

  service.moduleStatus = function(name) {
    return httpGetJSON(modulesUrl + '/' + name + '/get-status');
  };

  service.fieldStatus = function(module_name, field_name) {
    return httpGetJSON(modulesUrl + '/' + module_name + '/fields/' + field_name + '/get-status');
  };

  service.fieldAllStatus = function(module_name, field_name) {
    return httpGetJSON(modulesUrl + '/' + module_name + '/fields/' + field_name + '/get-all-statuses');
  };

  service.updateField = function(module, field, value) {
    return httpPostJSON(modulesUrl + '/update_field',
        { name: module.name, field: field.name, value: value });
  };

  var getModules = function(url, cachedModules, forceReload) {
    var deferred = $q.defer();
    if (!forceReload) {
      $http.get(url).success(function(data) {
        cachedModules = data;
        deferred.resolve(data);
      }).error(function() { deferred.reject(); });
    } else {
      deferred.resolve(cachedModules);
    }
    return deferred.promise;
  };

  // Get the list of available modules, optionally passing if this should force
  // a reload of this list
  service.availableModules = [];
  service.available = function(forceReload) {
    return getModules(storeUrl, this.availableModules, forceReload);
  };

  service.setRate = function(module, oldValue) {
    var value = parseInt(oldValue);
    if (!value || value < 1 || value > 5) {
      console.error('Invalid value', oldValue);
    }
    return httpPostJSON(storeUrl + '/rate',
        { name: module.name, value: value });
  };

  service.getRate = function(module) {
    return httpGetJSON(storeUrl + '/' + module.name + '/rate');
  };

  // Get the list of installed modules, optionally passing if this should force
  // a reload of this list
  service.installedModules = [];
  service.installed = function(forceReload) {
    return getModules(modulesUrl, this.installedModules, forceReload);
  };

  // Install a module, passing in the uploaded file object (see $upload for
  // details). Return a promise object for the given upload http call.
  service.installFromFile = function(file) {
    return $upload.upload({
      url: modulesUrl + '/install',
      method: 'POST', file: file
    });
  }
  // ...from the catalog
  service.installFromCatalog = function(module) {
    return httpPostJSON(modulesUrl + '/install',
        { name: module.name });
  }

  // Uninstall a module
  service.uninstall = function(module) {
    return httpPostJSON(modulesUrl + '/uninstall',
        { name: module.name });
  };

  return service;
});
