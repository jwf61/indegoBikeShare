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

    omnivore.csv('data/tripsByHourStation.csv')
        .on('ready', function(e) {
            drawMap(e.target.toGeoJSON());
            drawLegend(e.target.toGeoJSON());
            //retrieveInfoEnd(e.target.toGeoJSON());
            
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
    var stationEnd;
    function drawMap(data){
        //creating geoJson markers
        var stationStart = L.geoJson(data, options).addTo(map);
        var stationEnd = L.geoJson(data, options).addTo(map);
        stationStart.setStyle({
            color: '#13a3ce',
        });
        stationEnd.setStyle({
            color: '#575656',
        });
        
        resizeCircles(stationStart, stationEnd, 0);
        sequenceUI(stationStart, stationEnd);      
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
        retrieveInfoEnd(stationEnd, currentHour);
    };
                                            
    function sequenceUI(stationStart, stationEnd, currentHour){
         

            var hourControl = L.control({
                position: 'bottomright'
            });

            hourControl.onAdd = function (map) {

                var hour = L.DomUtil.get("hourBlock");

                L.DomEvent.disableScrollPropagation(hour);
                L.DomEvent.disableClickPropagation(hour);

                return hour;
            }
            
            hourControl.addTo(map);

            var output = $('#hourBlock span');
            
            var sliderControl = L.control({
                    position: 'bottomright'
                });

            sliderControl.onAdd = function (map) {

                var controls = L.DomUtil.get("slider");

                L.DomEvent.disableScrollPropagation(controls);
                L.DomEvent.disableClickPropagation(controls);

                return controls;

            }
            sliderControl.addTo(map);

            $('.slider')
                .on('input change', function () {
                    currentHour = $(this).val();
                    resizeCircles(stationStart, stationEnd, currentHour);

                    output.html(currentHour);
                });

        }
    function drawLegend(data) {
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
      
        var sortedValues = dataValues.sort(function(a, b) {
            return b - a;
        });

        var maxValue = Math.round(sortedValues[0] / 1000) * 800;

        var largeDiameter = calcRadius(maxValue) * 2,
            smallDiameter = largeDiameter / 2;

        $(".legend-circles").css('height', largeDiameter.toFixed());

        $('.legend-large').css({
            'width': largeDiameter.toFixed(),
            'height': largeDiameter.toFixed()
        });

        $('.legend-small').css({
            'width': smallDiameter.toFixed(),
            'height': smallDiameter.toFixed(),
            'top': largeDiameter - smallDiameter,
            'left': smallDiameter / 2
        })

        $(".legend-large-label").html(maxValue);
        $(".legend-small-label").html((maxValue / 2));

        $(".legend-large-label").css({
            'top': -11,
            'left': largeDiameter + 30,
        });

     
        $(".legend-small-label").css({
            'top': smallDiameter - 11,
            'left': largeDiameter + 30
        });

        $("<hr class='large'>").insertBefore(".legend-large-label")
        $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 10);
    
    }
      function retrieveInfoEnd(stationEnd, currentHour) {

        var info = $('#info');

        stationEnd.on('mouseover', function (e) {
            info.removeClass('none').show();

            var props = e.layer.feature.properties;
            $('#info span').html(props.stationName);
            $(".Starting span:first-child").html('(hour ' + currentHour + ')');
            $(".Ending span:first-child").html('(endHour ' + currentHour + ')');
            $(".Starting span:last-child").html(props['hour' + currentHour]);
            $(".Ending span:last-child").html(props['endHour' + currentHour]);
            // raise opacity level as visual affordance
            e.layer.setStyle({
                fillOpacity: .5,
                fillColor: '#3c0671'
            });

            // setStlye is firing with mouseout, just not info.hide() 
            //tried info.remove() which worked, but completely removed the info div, so the mouseover no longer work
            //info.fadeout works...for about two seconds, the info box reappears
        stationEnd.on('mouseout', function (e) {
                info.hide();
                e.layer.setStyle({
                    fillOpacity: 0
                });
        });

            $(document).mousemove(function (e) {

                info.css({
                    "left": e.pageX + 6,
                    "top": e.pageY - info.height() - 25
                });

                if (info.offset().top < 4) {
                    info.css({
                        "top": e.pageY + 15
                    });
                }

                if (info.offset().left + info.width() >= $(document).width() - 40) {
                    info.css({
                        "left": e.pageX - info.width() - 80
                    });
                }
            });

            var startValues = []
                , endValues = [];
            for (var i = 1; i <= 23; i++) {
                startValues.push(props['hour' + i]);
                endValues.push(props['endHour' + i]);
            }
            $('.startspark').sparkline(startValues, {
                width: '160px'
                , height: '30px'
                , lineColor: '#13a3ce'
                , fillColor: '#107998 '
                , spotRadius: 0
                , lineWidth: 1
            });
            $('.endspark').sparkline(endValues, {
                width: '160px'
                , height: '30px'
                , lineColor: '#211f1f'
                , fillColor: '#414350'
                , spotRadius: 0
                , lineWidth: 1
                });
        });
    }
      
    })();