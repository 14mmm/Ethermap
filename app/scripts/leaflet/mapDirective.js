'use strict';

/**
 * @memberof CollaborativeMap
 * @fileOverview Leaflet map directive. 
 * Initializes the map.
 * Loads already existing features from the Database.
 * Initializes the map Synchronization and the MapHandler
 * @exports CollaborativeMap.MapDirective
 * @requires  $http
 * @requires MapHandler
 * @requires SynchronizeMap
 * @author Dennis Wilhelm
 */
angular.module('CollaborativeMap')
  .directive('map', ['$http', 'MapHandler', 'SynchronizeMap',
    function($http, MapHandler, SynchronizeMap) {

      /**
       * Loads the initial features from the database and adds the features to the map
       * @param  {Object} http
       * @param  {String} mapId
       * @param  {Object} map
       * @param  {Object} drawnItems = layer group for features
       */
      function loadFeatures(http, mapId, map, drawnItems) {
        http({
          method: 'GET',
          url: '/api/features/' + mapId
        })
          .success(function(data) { //, status, headers, config) {
            if (data.rows) {
              data.rows.forEach(function(row) {
                MapHandler.addGeoJSONFeature(map, {
                  'feature': row.doc,
                  'fid': row.doc._id
                }, drawnItems);
              });
            }

          })
          .error(function(data) { //, status, headers, config) {
            console.log(data);
          });
      }


      return {
        restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
        template: '<div id="map"></div>',
        // templateUrl: '',
        replace: true,
        // transclude: true,
        // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
        link: function postLink($scope) {

          //expose map for debugging purposes
          //var map = window._map = L.mapbox.map('map', 'dnns.h8dkb1bh');
          var map = window._map = L.mapbox.map('map')
            .setView([51.95, 7.62], 13);

          // add an OpenStreetMap tile layer
          //         L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png')
          //            .addTo(map);
          L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png').addTo(map);

          map.addControl(L.mapbox.infoControl({
              position: 'bottomleft'
            })
            .addInfo('&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'));

          // Initialise the FeatureGroup to store editable layers
          var drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);

          // Initialise the draw control and pass it the FeatureGroup of editable layers
          var drawControl = window._drawControl =  new L.Control.Draw({
            edit: {
              featureGroup: drawnItems
            },
            draw: {
              circle: false,
              rectangle: false,
              marker: {
                icon: L.mapbox.marker.icon({})
              },
              polyline: {
                shapeOptions: {
                  color: '#555555',
                  fillOpacity: 0.5,
                  weight: 2,
                  opacity: 1
                }
              },
              polygon: {
                shapeOptions: {
                  color: '#555555',
                  fillOpacity: 0.5,
                  weight: 2,
                  opacity: 1
                }
              }
            }
          });
          map.addControl(drawControl);

          //Drawn features have to be added to the layer group
          map.on('draw:created', function(e) {
            drawnItems.addLayer(e.layer);
          });

          //Out of some unknown reasons the leaflet.draw tooltips where deactivated
          map.options.drawControlTooltips = true;

          //Load already existing features from the db
          loadFeatures($http, $scope.mapId, map, drawnItems);

          //Initialize the MapHandler (wrapper for all map based actions)
          MapHandler.initMapHandler(map, drawnItems, $scope, drawControl);

          //Initialize the map synchronization (handles all Websocket related sync stuff)
          SynchronizeMap.init(map, $scope, drawnItems);

        }
      };
    }
  ]);
