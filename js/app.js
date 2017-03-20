(function ( ) {

    // mapbox access token for jfisher account
    L.mapbox.accessToken = 'pk.eyJ1IjoiandmNjEiLCJhIjoiY2l6YWM1Z2Q4MDFzeDJxcG84eDZpN2RldyJ9.1LNIWHjOoRpUGQElZKUEBg';
    

        // create the Leaflet map using mapbox.light tiles
    var map = L.mapbox.map('map', 'mapbox.streets', {
        zoomSnap: .1,
        center: [39.958, -75.16],
        zoom: 13.5,
        minZoom: 6,
        maxZoom: 15,
        //maxBounds: L.latLngBounds([-6.22, 27.72],[5.76, 47.83])
    });
    
    legend.onAdd = function(map) {

            // select the element with id of 'legend'
            var div = L.DomUtil.get("legend");

            // disable the mouse events
            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            // add legend to the control
            return div;
        }
    // create Leaflet control for the slider
    var sliderControl = L.control({
        position: 'bottomleft'
    });

    // when added to the map
    sliderControl.onAdd = function(map) {

        // select the element with id of 'slider'
        var controls = L.DomUtil.get("slider");

        // disable the mouse events
        L.DomEvent.disableScrollPropagation(controls);
        L.DomEvent.disableClickPropagation(controls);

        // add slider to the control
        return controls;

    }

    // add the control to the map
    sliderControl.addTo(map);
    
    // load CSV data
    omnivore.csv('data/tripsByHourStation.csv')
        .on('ready', function(e) {
            drawMap(e.target.toGeoJSON());
            drawLegend(e.target.toGeoJSON());
            
        })
        .on('error', function(e) {
            console.log(e.error[0].message);
        }); 
    
    //creating default cicle options
    var options = {
        pointToLayer: function(feature, d) {
            return L.circleMarker(d, {
                opacity: 1,
                weight: 2,
                fillOpacity: .3,
            })
        
        }
    }
    
    //draw data, 1 layer for boys, 1 for girls
    function drawMap(data){
        //creating geoJson markers
        var stationStart = L.geoJson(data, options).addTo(map);
       
        stationStart.setStyle({
            color: '#73d686',
            fillColor: '#3781b7'
        });
        
        resizeCircles(stationStart, 1);
        sequenceUI(stationStart);
        
    }
    function calcRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * 2; // adjust .5 as a scale factor
    }
    
    function resizeCircles(stationStart, currentHour) {

        stationStart.eachLayer(function(layer) {
            var radius = calcRadius(Number(layer.feature.properties['hour' + currentHour]));
            layer.setRadius(radius);
        });
        retrieveInfo(stationStart, currentHour);
        //retrieveGrade(currentHour)
    }
    
    function sequenceUI(stationStart, boysLayer){
        $('.slider')
            .on('input change', function() {
                var currentHour = $(this).val();
                resizeCircles(stationStart, currentHour);
            });
        // create Leaflet control for the slider
            var sliderControl = L.control({
                position: 'bottomleft'
            });
    }

    function drawLegend(data) {
         //create Leaflet control for the legend
        var legend = L.control({
            position: 'bottomright'
        });
        
        legend.onAdd = function(map) {

            var div = L.DomUtil.get("legend");

            L.DomEvent.disableScrollPropagation(div);
            L.DomEvent.disableClickPropagation(div);

            return div;

        }

    legend.addTo(map);
        
        var dataValues = [];
        data.features.map(function (school) {
                for (var grade in school.properties) {
                    var attribute = school.properties[grade];
                    if (Number(attribute)) {
                        dataValues.push(attribute);
                    }
                }
        })
        // sort our array
        var sortedValues = dataValues.sort(function(a, b) {
            return b - a;
        });

        // round the highest number and use as our large circle diameter
        var maxValue = Math.round(sortedValues[0] / 1000) * 1000;


        // calc the diameters
        var largeDiameter = calcRadius(maxValue) * 2,
            smallDiameter = largeDiameter / 2;

        // select our circles container and set the height
        $(".legend-circles").css('height', largeDiameter.toFixed());

        // set width and height for large circle
        $('.legend-large').css({
            'width': largeDiameter.toFixed(),
            'height': largeDiameter.toFixed()
        });
        // set width and height for small circle and position
        $('.legend-small').css({
            'width': smallDiameter.toFixed(),
            'height': smallDiameter.toFixed(),
            'top': largeDiameter - smallDiameter,
            'left': smallDiameter / 2
        })

        // label the max and median value
        $(".legend-large-label").html(maxValue);
        $(".legend-small-label").html((maxValue / 2));

        // adjust the position of the large based on size of circle
        $(".legend-large-label").css({
            'top': -11,
            'left': largeDiameter + 30,
        });

        // adjust the position of the large based on size of circle
        $(".legend-small-label").css({
            'top': smallDiameter - 11,
            'left': largeDiameter + 30
        });

        // insert a couple hr elements and use to connect value label to top of each circle
        $("<hr class='large'>").insertBefore(".legend-large-label")
        $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);
    
    }
    function retrieveInfo(startStation, currentHour){
        var info = $('#info');
        
        $(".info").hide();//hides info window until county is selected
        
        startStation.on('mouseover', function(e) {

            info.removeClass('none').show();

            var props = e.layer.feature.properties;

            $('#info span').html(props.stationName);
            $(".girls span:first-child").html('(grade ' + currentHour + ')');
            $(".girls span:last-child").html(props['G' + currentHour]);
            
            // raise opacity level as visual affordance
            e.layer.setStyle({
                fillOpacity: .6
            });

                
        // hide the info panel when mousing off layergroup and remove affordance opacity
        startStation.on('mouseout', function(e) {
            info.hide();
            e.layer.setStyle({
                fillOpacity: 0
            });
        });
        // when the mouse moves on the document
        $(document).mousemove(function(e) {
            // first offset from the mouse position of the info window
            info.css({
                "left": e.pageX + 6,
                "top": e.pageY - info.height() - 25
            });

            // if it crashes into the top, flip it lower right
            if (info.offset().top < 4) {
                info.css({
                    "top": e.pageY + 15
                });
            }
            // if it crashes into the right, flip it to the left
            if (info.offset().left + info.width() >= $(document).width() - 40) {
                info.css({
                    "left": e.pageX - info.width() - 80
                });
            }
        
//            var stationValues = [],
//
//            for (var i = 1; i <= 8; i++) {
//                stationValues.push(props['hour' + i])
//            }
//            $('.girlspark').sparkline(girlsValues, {
//                width: '160px',
//                height: '30px',
//                lineColor: '#D96D02',
//                fillColor: '#d98939 ',
//                spotRadius: 0,
//                lineWidth: 2
//            });

         
        });
        }); 
        
        
        
    }
    
    
    
    
    })();
