
mapboxgl.accessToken = 'pk.eyJ1IjoiY3dob25nIiwiYSI6IjAyYzIwYTJjYTVhMzUxZTVkMzdmYTQ2YzBmMTM0ZDAyIn0.owNd_Qa7Sw2neNJbK6zc1A';

var map = new mapboxgl.Map({
  container: 'mapContainer',
  style: 'mapbox://styles/mapbox/light-v9',
  center: [-73.930113,40.648932],
  zoom: 13.5,
});
//To toggle between layers
var toggleParking = false;
var toggleVacant = false;

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
  closeButton: true,
  closeOnClick: false
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// a helper function for looking up colors and descriptions for NYC land use codes
var LandUseLookup = (code) => {
  switch (code) {
    case 1:
    return {
      color: '#f4f455',
      description: '1 & 2 Family',
    };
    case 2:
    return {
      color: '#f7d496',
      description: 'Multifamily Walk-up',
    };
    case 3:
    return {
      color: '#FF9900',
      description: 'Multifamily Elevator',
    };
    case 4:
    return {
      color: '#f7cabf',
      description: 'Mixed Res. & Commercial',
    };
    case 5:
    return {
      color: '#ea6661',
      description: 'Commercial & Office',
    };
    case 6:
    return {
      color: '#d36ff4',
      description: 'Industrial & Manufacturing',
    };
    case 7:
    return {
      color: '#dac0e8',
      description: 'Transportation & Utility',
    };
    case 8:
    return {
      color: '#5CA2D1',
      description: 'Public Facilities & Institutions',
    };
    case 9:
    return {
      color: '#8ece7c',
      description: 'Open Space & Outdoor Recreation',
    };
    case 10:
    return {
      color: '#000000',
      description: 'Parking Facilities',
    };
    case 11:
    return {
      color: '#993333',
      description: 'Vacant Land',
    };
    case 12:
    return {
      color: '#5f5f60',
      description: 'Other',
    };
    default:
    return {
      color: '#5f5f60',
      description: 'Other',
    };
  }
};

// using jquery to programmatically create a Legend
// for numbers 1 - 11, get the land use color and description
for (var i=1; i<12; i++) {
  // lookup the landuse info for the current iteration
  const landuseInfo = LandUseLookup(i);

  // this is a simple jQuery template, it will append a div to the legend with the color and description
  $('#legend-box').append(`
    <div>
    <div class="legend-color-box" style="background-color:${landuseInfo.color};"></div>
    ${landuseInfo.description}
    </div>
    `)
  }

  // Object for looking up neighborhood center points
  var neighborHoodLookup = {
    'Crown-Heights': [-73.931347,40.660131],
    'Lefferts-Garden': [-73.931304,40.646522],
    'East-Flatbush': [-73.930489,40.636036],
  }

  // add a button click listener that will control the map
  $('.flyto').on('click', function(e) {
    // Pulling out the data attribute for the neighborhood using query
    var neighborhood = $(e.target).data('neighborhood');
    // this is a notation for looking up a key in an object using a variable
    var center = neighborHoodLookup[neighborhood];
    // fly to the neighborhood's center point
    map.flyTo({center: center, zoom: 15.2});
  });

  // we can't add our own sources and layers until the base style is finished loading
  map.on('style.load', function() {

    // setting the basemap style
    map.setPaintProperty('water', 'fill-color', '#a4bee8')

    // this sets up the geojson as a source in the map, which can be used to add visual layers
    map.addSource('Pluto-data', {
      type: 'geojson',
      data: './data/Pluto-data.geojson',
    });

    // adding a custom-styled layer for tax lots
    map.addLayer({
      id: 'utica-lots-fill',
      type: 'fill',
      source: 'Pluto-data',
      paint: {
        'fill-opacity': 0.8,
        'fill-color': {
          type: 'categorical',
          property: 'landuse',
          stops: [
            [
              '01',
              LandUseLookup(1).color,
            ],
            [
              "02",
              LandUseLookup(2).color,
            ],
            [
              "03",
              LandUseLookup(3).color,
            ],
            [
              "04",
              LandUseLookup(4).color,
            ],
            [
              "05",
              LandUseLookup(5).color,
            ],
            [
              "06",
              LandUseLookup(6).color,
            ],
            [
              "07",
              LandUseLookup(7).color,
            ],
            [
              "08",
              LandUseLookup(8).color,
            ],
            [
              "09",
              LandUseLookup(9).color,
            ],
            [
              "10",
              LandUseLookup(10).color,
            ],
            [
              "11",
              LandUseLookup(11).color,
            ],
          ]
        }
      }
    }, 'waterway-label')

    // adding an empty data source, which we will use to highlight the lot the user is hovering over
    map.addSource('highlight-feature', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    // adding a layer for the highlighted lot
    map.addLayer({
      id: 'highlight-line',
      type: 'line',
      source: 'highlight-feature',
      paint: {
        'line-width': 3,
        'line-opacity': 0.9,
        'line-color': 'gray',
      }
    });
  })

  map.on('click', 'utica-lots-fill', function(e) {
    var features = map.queryRenderedFeatures(e.point, {
      layers: ['utica-lots-fill'],
    });

    var lot = features[0];
    if(!lot) {
      console.log("Not a lot!");
      return;
    }
    //Setting the propoerties to parking and vacant land
    landuse = parseInt(lot.properties.landuse);
    if(landuse != 10 && landuse != 11) {
      return;
    }
    //Setting up the popup closing
    console.log("removing popup");
    popup.remove();
    popupBody = "<b>Lot area: </b>" + lot.properties.lotarea;
    popupBody += "<br><b>Builtfar: </b>" + lot.properties.builtfar;
    popupBody += "<br><b>Zone district 1: </b>" + lot.properties.zonedist1;
    popup.setLngLat(e.lngLat)
    .setHTML(popupBody)
    .addTo(map);
  })

  // when the mouse moves, do stuff!
  map.on('mousemove', function (e) {
    // query for the features under the mouse, but only in the lots layer
    var features = map.queryRenderedFeatures(e.point, {
      layers: ['utica-lots-fill'],
    });

    // get the first feature from the array of returned features.
    var lot = features[0]

    if (lot) {  // if there's a lot under the mouse, do stuff
    map.getCanvas().style.cursor = 'pointer';  // make the cursor a pointer
    // set this lot's polygon feature as the data for the highlight source
    map.getSource('highlight-feature').setData(lot.geometry);
  } else {
    map.getCanvas().style.cursor = 'default'; // make the cursor default
    // reset the highlight source to an empty featurecollection
    map.getSource('highlight-feature').setData({
      type: 'FeatureCollection',
      features: []
    });
  }
})


// click actions on parking and vacant buttons
function parking() {
  toggleParking = !toggleParking;
  if(toggleParking) {
    toggleVacant = false;
    document.getElementsByClassName('buttonv')[0].style.backgroundColor = '#999999';
    document.getElementsByClassName('buttonp')[0].style.backgroundColor = '#006699';
    map.setFilter('utica-lots-fill',['==', 'landuse', '10']);
  } else {
    toggleVacant = false;
    document.getElementsByClassName('buttonp')[0].style.backgroundColor = '#999999';
    document.getElementsByClassName('buttonv')[0].style.backgroundColor = '#999999';
    map.setFilter('utica-lots-fill', null)
  }
}

function vacant() {
  toggleVacant = !toggleVacant;
  if(toggleVacant) {
    document.getElementsByClassName('buttonv')[0].style.backgroundColor = '#006699';
    document.getElementsByClassName('buttonp')[0].style.backgroundColor = '#999999';
    toggleParking = false;
    map.setFilter('utica-lots-fill',['==', 'landuse', '11']);
  } else {
    document.getElementsByClassName('buttonp')[0].style.backgroundColor = '#999999';
    document.getElementsByClassName('buttonv')[0].style.backgroundColor = '#999999';
    toggleParking = false;
    map.setFilter('utica-lots-fill', null)
  }
}

// On CLick of Parking Button
$('.buttonp').on('click', function() {
  parking()
});

// On CLick of Vacant lot Button
$('.buttonv').on('click', function() {
  vacant()
});
