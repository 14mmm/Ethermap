'use strict';

angular.module('CollaborativeMap')
  .service('SynchronizeMap', ['MapMovementEvents', 'MapDrawEvents', 'Socket',
    function(MapMovementEvents, MapDrawEvents, Socket) {

      var mapScope;

      function sendMapMovements(mapId, event) {
        var message = {
          'event': event,
          'mapId': mapId
        };

        Socket.emit('mapMovement', message, function(res) {
          console.log(res);
        });
      }

      function isWachtingUser(userId) {
        var res = mapScope.isWatchingAll || mapScope.watchUsers[userId] || false;
        console.log(res);
        return res;
      }

      function receiveMapMovements(mapId, map) {
        Socket.on(mapId + '-mapMovement', function(res) {
          if (res.event && res.event.nE && res.event.sW && res.event.userId) {
            var newBounds = new L.LatLngBounds(res.event.nE, res.event.sW);
            mapScope.userBounds[res.event.userId] = newBounds;
            if (isWachtingUser(res.event.userId)) {
              map.fitBounds(newBounds);
            }
          }
        });
      }

      function sendMapDraws(mapId, event) {
        var message = {
          'event': event,
          'mapId': mapId
        };

        Socket.emit('mapDraw', message, function(res) {
          console.log(res);
        });

      }

      function addGeoJSONFeature(map, event, drawnItems) {
        //jshint camelcase:false
        var newLayer = L.geoJson(event.feature);
        var tmpLayer;
        for (var key in newLayer._layers) {
          tmpLayer = newLayer._layers[key];
          tmpLayer._leaflet_id = event.fid;
          tmpLayer.addTo(drawnItems);
        }
      }

      function removeLayer(map, event, drawnItems) {
        var deleteLayer = map._layers[event.fid];
        if (deleteLayer) {
          map.removeLayer(deleteLayer);
          drawnItems.removeLayer(deleteLayer);
        }
      }

      function receiveMapDraws(mapId, map, drawnItems) {

        Socket.on(mapId + '-mapDraw', function(res) {
          if (res && res.event) {
            var event = res.event;

            if (event.action === 'created') {

              addGeoJSONFeature(map, event, drawnItems);

            } else if (event.action === 'edited') {

              removeLayer(map, event, drawnItems);
              addGeoJSONFeature(map, event, drawnItems);

            } else if (event.action === 'deleted') {

              removeLayer(map, event, drawnItems);

            }

          }
        });
      }

      function receiveUsers(mapId) {
        Socket.on(mapId + '-users', function(res) {
          mapScope.users = res.users;
        });
      }

      function login(mapId, userName) {
        Socket.emit('login', {
          'mapId': mapId,
          'user': userName
        });
      }


      return {

        init: function(map, scope, drawnItems) {
          mapScope = scope;
          login(mapScope.mapId, mapScope.userName);

          MapMovementEvents.connectMapEvents(map, function(event) {
            sendMapMovements(scope.mapId, event);
          });

          receiveMapMovements(scope.mapId, map);
          receiveUsers(scope.mapId);

          MapDrawEvents.connectMapEvents(map, scope, function(event) {
            sendMapDraws(scope.mapId, event);
          });

          receiveMapDraws(scope.mapId, map, drawnItems);
        }



      };

    }
  ]);