angular.module('portainer.services')
.factory('RegistryService', ['$q', 'Registries', 'DockerHubService', 'RegistryHelper', 'ImageHelper', function RegistryServiceFactory($q, Registries, DockerHubService, RegistryHelper, ImageHelper) {
  'use strict';
  var service = {};

  service.registries = function() {
    var deferred = $q.defer();

    Registries.query().$promise
    .then(function success(data) {
      var registries = data.map(function (item) {
        return new RegistryViewModel(item);
      });
      deferred.resolve(registries);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registries', err: err});
    });

    return deferred.promise;
  };

  service.registry = function(id) {
    var deferred = $q.defer();

    Registries.get({id: id}).$promise
    .then(function success(data) {
      var registry = new RegistryViewModel(data);
      deferred.resolve(registry);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve registry details', err: err});
    });

    return deferred.promise;
  };

  service.encodedCredentials = function(registry) {
    var credentials = {
      username: registry.Username,
      password: registry.Password,
      serveraddress: registry.URL
    };
    return btoa(JSON.stringify(credentials));
  };

  service.updateAccess = function(id, authorizedUserIDs, authorizedTeamIDs) {
    return Registries.updateAccess({id: id}, {authorizedUsers: authorizedUserIDs, authorizedTeams: authorizedTeamIDs}).$promise;
  };

  service.deleteRegistry = function(id) {
    return Registries.remove({id: id}).$promise;
  };

  service.updateRegistry = function(registry) {
    return Registries.update({ id: registry.Id }, registry).$promise;
  };

  service.createRegistry = function(name, URL, authentication, username, password) {
    var payload = {
      Name: name,
      URL: URL,
      Authentication: authentication
    };
    if (authentication) {
      payload.Username = username;
      payload.Password = password;
    }
    return Registries.create({}, payload).$promise;
  };

  service.retrieveRegistryFromRepository = function(repository) {
    var deferred = $q.defer();

    var imageDetails = ImageHelper.extractImageAndRegistryFromRepository(repository);
    $q.when(imageDetails.registry ? service.registries() : DockerHubService.dockerhub())
    .then(function success(data) {
      var registry = data;
      if (imageDetails.registry) {
        registry = RegistryHelper.getRegistryByURL(data, imageDetails.registry);
      }
      deferred.resolve(registry);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve the registry associated to the repository', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
