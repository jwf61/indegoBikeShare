(function ( ) {

    // mapbox access token for jfisher account
    L.mapbox.accessToken = 'pk.eyJ1IjoiandmNjEiLCJhIjoiY2l6YWM1Z2Q4MDFzeDJxcG84eDZpN2RldyJ9.1LNIWHjOoRpUGQElZKUEBg';
    

        // create the Leaflet map using mapbox.light tiles
    var map = L.mapbox.map('map', 'mapbox.streets', {
        zoomSnap: .1,
        center: [39.96, -75.16],
        zoom: 13.9,
        minZoom: 12,
        maxZoom: 16,
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
        position: 'bottomright'
    });

    sliderControl.onAdd = function(map) {

        // select the element with id of 'slider'
        var controls = L.DomUtil.get("slider");

        // disable the mouse events
        L.DomEvent.disableScrollPropagation(controls);
        L.DomEvent.disableClickPropagation(controls);

        // add slider to the control
        return controls;

    }
    
   //hourCounter.addTo(map);
    
    var hourControl = L.control({
        position: 'bottomright'
    });

    hourControl.onAdd = function(map) {

        var controls = L.DomUtil.get("hourCounter");

        L.DomEvent.disableScrollPropagation(counter);
        L.DomEvent.disableClickPropagation(counter);

        return counter;
    }
       
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
                opacity: .9,
                weight: 2,
                fillOpacity: 0,
            })
        
        }
    }
    
    function drawMap(data){
        //creating geoJson markers
        var stationStart = L.geoJson(data, options).addTo(map);
        var stationEnd = L.geoJson(data, options).addTo(map);
        stationStart.setStyle({
            color: '#17b936',
        });
        stationEnd.setStyle({
            color: '#38375a',
        });
        
        resizeCircles(stationStart, stationEnd, 0);
        sequenceUI(stationStart, stationEnd);      
        hourUI(stationStart);
    }
    
    function calcRadius(val) {
        var radius = Math.sqrt(val / Math.PI);
        return radius * 2; 
    }
    
    function resizeCircles(stationStart, stationEnd, currentHour) {

        stationStart.eachLayer(function(layer) {
            var radius = calcRadius(Number(layer.feature.properties['hour' + currentHour]));
            layer.setRadius(radius);
        });
        stationEnd.eachLayer(function(layer) {
            var radius = calcRadius(Number(layer.feature.properties['endHour' + currentHour]));
            layer.setRadius(radius);
        });
        retrieveInfo(stationStart, currentHour);
        retrieveInfoEnd(stationEnd, currentHour);
    }
    
    function hourUI(stationStart, currentHour) {
        stationStart.eachLayer(function (layer) {
        var props = layer.feature.properties;
        $(".Hour span").html(currentHour );
        });
    };
                                        
    function sequenceUI(stationStart, stationEnd, currentHour){
        $('.slider')
            .on('input change', function() {
                var currentHour = $(this).val();
                resizeCircles(stationStart, stationEnd, currentHour);
            });
//        // create Leaflet control for the slider
//            var sliderControl = L.control({
//                position: 'bottomleft'
//            })
        $('.counter')
            .on('input change', function() {
                var currentHour = $(this);
                hourUI(stationStart, currentHour)
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
        data.features.map(function (station) {
                for (var hour in station.properties) {
                    var attribute = station.properties[hour];
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
        var maxValue = Math.round(sortedValues[0] / 1000) * 800;


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
        $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 10);
    
    }
    function retrieveInfo(startStation, currentHour){
        var info = $('#info');
        
        //$(".info").hide();//hides info window until county is selected
        
            startStation.on('mouseover', function(e) {

            info.removeClass('none').show();
            
            var props = e.layer.feature.properties;

             $('#info span').html(props.stationName);
            $(".Starting span:first-child").html('(hour ' + currentHour + ')');
            $(".Ending span:first-child").html('(endHour ' + currentHour + ')');
            $(".Starting span:last-child").html(props['hour' + currentHour]);
            $(".Ending span:last-child").html(props['endHour' + currentHour]);
            // raise opacity level as visual affordance
            e.layer.setStyle({
                fillOpacity: .6
            });

                
        // hide the info panel when mousing off layergroup and remove affordance opacity
        startStation.on('mouseout', function(e) {
            info.removeClass('none').hide();
            info.hide();
            $("info").hide();
            e.layer.setStyle({
                fillOpacity: 0,
                            
            });
        });
        // when the mouse moves on the document
        $(document).mouseover(function(e) {
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
        
            var startValues = [],
                endValues = [];

            for (var i = 1; i <= 23; i++) {
                startValues.push(props['hour' + i]);
                endValues.push(props['endHour' + i]);
            }
            $('.startspark').sparkline(startValues, {
                width: '160px',
                height: '30px',
                lineColor: '#17b936',
                fillColor: '#3c7246 ',
                spotRadius: 0,
                lineWidth: 2
            });

            $('.endspark').sparkline(endValues, {
                width: '160px',
                height: '30px',
                lineColor: '#6E77B0',
                fillColor: '#55596d',
                spotRadius: 0,
                lineWidth: 2
            });

         
        });
        }); 
        
        
        
    }
    function retrieveInfoEnd(endStation, currentHour){
        var info = $('#info');
        
        //$(".info").hide();//hides info window until county is selected
        
            endStation.on('mouseover', function(e) {

            info.removeClass('none').show();
            
            var props = e.layer.feature.properties;

            $('#info span').html(props.stationName);
            $(".Starting span:first-child").html('(hour ' + currentHour + ')');
            $(".Ending span:first-child").html('(endHour ' + currentHour + ')');
            $(".Starting span:last-child").html(props['hour' + currentHour]);
            $(".Ending span:last-child").html(props['endHour' + currentHour]);
            // raise opacity level as visual affordance
            e.layer.setStyle({
                fillOpacity: .6
            });

                
        // hide the info panel when mousing off layergroup and remove affordance opacity
        endStation.on('mouseout', function(e) {
            info.removeClass('none').hide();
            info.hide();
            $("info").hide();
            e.layer.setStyle({
                fillOpacity: 0
                
            });
        });
        // when the mouse moves on the document
        $(document).mouseover(function(e) {
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
        
            var startValues = [],
                endValues = [];

            for (var i = 1; i <= 23; i++) {
                startValues.push(props['hour' + i]);
                endValues.push(props['endHour' + i]);
            }
            $('.startspark').sparkline(startValues, {
                width: '160px',
                height: '30px',
                lineColor: '#17b936',
                fillColor: '#3c7246 ',
                spotRadius: 0,
                lineWidth: 2
            });

            $('.endspark').sparkline(endValues, {
                width: '160px',
                height: '30px',
                lineColor: '#6E77B0',
                fillColor: '#55596d',
                spotRadius: 0,
                lineWidth: 2
            });

         
        });
        }); 
        
        
        
    }
    // when added to the map
    
    sliderControl.addTo(map);
    hourControl.addTo(map)
    
    
    })();