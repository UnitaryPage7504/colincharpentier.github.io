// Dépendance aux fichiers pmtiles
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Configuration de la carte
var map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  customAttribution: '<a href="https://sites-formations.univ-rennes2.fr/mastersigat/" target="_blank">Master SIGAT</a>',
  center: [-1.67, 48.11],
  zoom: 11.5,
  pitch: 0,
  bearing: 0,
  minZoom: 11.5
});

// Pitch simple et extrusion au zoom 15 (sans fluidité problématique)
map.on('zoomend', function() {
    var zoom = map.getZoom();
    
    // Activer le pitch seulement au zoom 15+
    if (zoom >= 14) {
        map.easeTo({ pitch: 60, duration: 1000 });
        map.setLayoutProperty('batiments', 'visibility', 'visible');
    } else {
        map.easeTo({ pitch: 0, duration: 1000 });
        map.setLayoutProperty('batiments', 'visibility', 'none');
    }
});

// Boutons de navigation
var nav = new maplibregl.NavigationControl();
map.addControl(nav, 'top-left');

// Ajout Echelle cartographique
map.addControl(new maplibregl.ScaleControl({
  maxWidth: 120,
  unit: 'metric'
}));

// Bouton de géolocalisation
map.addControl(new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true
}));

// Appel du flux de données
map.on('load', function () {

  map.addSource("PLU", {
    type: "vector",
    url: "pmtiles://https://raw.githubusercontent.com/UnitaryPage7504/Data/refs/heads/main/Data_RM/PLUIRM.pmtiles"
  });
  
  //Ajout contour des communes
  map.addSource('ADMIN_EXPRESS', {
    type: 'vector',
    url: 'https://data.geopf.fr/tms/1.0.0/ADMIN_EXPRESS/metadata.json',
    minzoom: 0,
    maxzoom: 14
  });

  map.addLayer({
    id: 'communes',
    type: 'line',
    source: 'ADMIN_EXPRESS',
    'source-layer': 'commune',
    paint: {
      'line-color': '#FFFFFF',
      'line-width': 2
    }
  });
  
  // Ajout BDTOPO
  map.addSource('BDTOPO', {
    type: 'vector',
    url: 'https://data.geopf.fr/tms/1.0.0/BDTOPO/metadata.json',
    minzoom: 10,
    maxzoom: 19
  });
  
  // Ajout végétation
  map.addLayer({
    'id': 'vegetation',
    'type': 'fill',
    'source': 'BDTOPO',
    'source-layer': 'zone_de_vegetation',
    'paint': {'fill-color': 'green'},
    'layout': {'visibility': 'none'},
  });
  
  // Couche de remplissage AVEC contour blanc
  map.addLayer({
    id: "PLU_RM_fill",
    type: "fill",
    source: "PLU",
    "source-layer": "PLUIRM",
    'layout': {'visibility': 'none'},
    paint: {
        'fill-color': [
            'match',
            ['get', 'typezone'],
            'A', 'yellow',
            'U', 'red',
            'N', 'green',
            '#CCCCCC'
        ],
        'fill-opacity': 0.6,
        'fill-outline-color': 'white'
    }
  });
  
  // Couche de contour séparée
  map.addLayer({
    id: "PLU_RM_outline",
    type: "line",
    source: "PLU",
    "source-layer": "PLUIRM",
    'layout': {'visibility': 'none'},
    minzoom: 10,
    paint: {
      'line-color': 'white',
      'line-width': {'base': 0.5,'stops': [[13, 0.2], [20, 1]]}
    }
  });
  
  // AJOUT DU CADASTRE ETALAB
  map.addSource('Cadastre', {
    type: 'vector',
    url: 'https://openmaptiles.geo.data.gouv.fr/data/cadastre.json'
  });
  
  map.addLayer({
    'id': 'Cadastre',
    'type': 'line',
    'source': 'Cadastre',
    'source-layer': 'parcelles',
    'layout': {'visibility': 'none'},
    'paint': {'line-color': '#FFFFFF', 'line-width': 1},
    'minzoom': 16,
    'maxzoom': 20
  });
  
  // Ajout lignes de metros
  map.addSource('lignes', {
    type: 'geojson',
    data: 'https://data.rennesmetropole.fr/api/explore/v2.1/catalog/datasets/metro-du-reseau-star-traces-de-laxe-des-lignes/exports/geojson?lang=fr&timezone=Europe%2FBerlin'
  });
  
  map.addLayer({
    id: 'lignesmetros',
    type: 'line',
    source: 'lignes',
    paint: {
      'line-opacity': 1,
      'line-width': 4,
      'line-color': [
        'match',
        ['get', 'ligne'],
        'a', '#FF0000',
        'b', '#00E600',
        '#ccc'
      ]
    }
  });
  
  // Bâtiments extrusion (SANS modification, reste comme avant)
  map.addLayer({
    'id': 'batiments',
    'type': 'fill-extrusion',
    'source': 'BDTOPO',
    'layout': {'visibility': 'none'},
    'source-layer': 'batiment',
    "filter": ['==', 'usage_1', 'Résidentiel'],
    'paint': {
      'fill-extrusion-color': '#A9A9A9',
      'fill-extrusion-height': {'type': 'identity', 'property': 'hauteur'},
      'fill-extrusion-opacity': 1,
      'fill-extrusion-base': 0
    }
  });
  
  //Ajout des vélostars
  $.getJSON('https://data.explore.star.fr/api/explore/v2.1/catalog/datasets/vls-stations-etat-tr/records?limit=60',
    function(data) {
      var geojsonVelostar = {
        type: 'FeatureCollection',
        features: data.results.map(function(element) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [element.coordonnees.lon, element.coordonnees.lat]
            },
            properties: {
              name: element.nom,
              capacity: element.jrdinfosoliste,
              nbvelos : element.nombrevelosdisponibles,
              nbemplacements : element.nombreemplacementsdisponibles,
            }
          };
        })
      };
      
      map.addLayer({
        'id': 'velostar',
        'type': 'circle',
        'layout': {'visibility': 'none'},
        'source': {
          'type': 'geojson',
          'data': geojsonVelostar
        },
        'paint': {
          'circle-color': 'orange',
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'white'
        }
      });
    }
  );
  
  //Ajout des parcs relais
  $.getJSON('https://data.explore.star.fr/api/explore/v2.1/catalog/datasets/tco-parcsrelais-star-etat-tr/records?limit=20',
    function(data) {
      var geojsonParcRelais = {
        type: 'FeatureCollection',
        features: data.results.map(function(element) {
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [element.coordonnees.lon, element.coordonnees.lat]
            },
            properties: {
              name: element.nom,
              nbvelos: element.nombrevelosdisponibles,
              nbsocles: element.nombreemplacementsdisponibles,
              capacity: element.jrdinfosoliste
            }
          };
        })
      };
      
      map.addLayer({
        'id': 'parcrelais',
        'type': 'circle',
        'source': {
          'type': 'geojson',
          'data': geojsonParcRelais
        },
        'paint': {
          'circle-color': 'blue',
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'white'
        }
      });
    }
  );
  
}); //Fin du map.on

//Interactivité HOVER sur les parcs relais
var popup = new maplibregl.Popup({
  className: "Mypopup parcrelais",
  closeButton: false,
  closeOnClick: false 
});

map.on('mousemove', function(e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['parcrelais'] });
  map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
  
  if (!features.length) {
    popup.remove();
    return; 
  }
  
  var feature = features[0];
  popup.setLngLat(feature.geometry.coordinates)
    .setHTML('<b>'+feature.properties.name+'</b>' + 
             '<br><br>' + 
             'Capacité: ' + feature.properties.capacity + ' places disponibles')
    .addTo(map);
});

//Interactivité CLICK sur les vélostars
map.on('click', function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['velostar'] });
  if (!features.length) {
    return;
  }
  
  var feature = features[0];
  var popup = new maplibregl.Popup({ 
    offset: [0, -15],
    className: 'Mypopup'
  })
    .setLngLat(feature.geometry.coordinates)
    .setHTML('<h2>' + feature.properties.name + '</h2><h3>' +
             "Nombre de vélos disponibles : " + feature.properties.nbvelos + '</h3><p>' +
             "Nombre d'emplacements disponibles : " + feature.properties.nbemplacements + '</p>')
    .addTo(map);
});

map.on('mousemove', function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['Arrets'] });
  map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});

//Fonction switchlayer
switchlayer = function (lname) {
    if (document.getElementById(lname + "CB").checked) {
        map.setLayoutProperty(lname, 'visibility', 'visible');
    } else {
        map.setLayoutProperty(lname, 'visibility', 'none');
   }
};

// Configuration onglets géographiques 

document.getElementById('Rennes').addEventListener('click', function () 
{ map.flyTo({zoom: 12,
           center: [-1.672, 48.1043],
	          pitch: 0,
            bearing:0 });
});

document.getElementById('Gare').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.672, 48.1043],
	          pitch: 20,
            bearing: -197.6 });
});


document.getElementById('Rennes1').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.6396, 48.1186],
	          pitch: 20,
            bearing: -197.6 });
});

document.getElementById('Rennes2').addEventListener('click', function () 
{ map.flyTo({zoom: 16,
           center: [-1.7023, 48.1194],
	          pitch: 30,
            bearing: -197.6 });
});