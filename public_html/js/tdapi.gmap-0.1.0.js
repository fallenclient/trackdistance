/*jshint*/
/** ==TDAPI Google Maps API Handler==
 * Google Maps API functions for TDAPI
 * Event Handlers, Data Manipulation and Page Presentation
 * @version 0.1.0.XX
 * @author David Fisher <dave@fishblade.co.uk>
 * @package tdapi
 */
var tdapi = tdapi || {};
tdapi.gmap = tdapi.gmap || {};
(function(context) {
    var polylineArray = [],
            markerArray = [],
            markerBounds = new google.maps.LatLngBounds(),
            playlistHighlights = [];

    /**
     * Bind Info Window
     * Binds a click responsive info window to a marker
     * 
     * @param {object} marker Google.maps.Marker
     * @param {object} map Google.maps.Map
     * @param {object} infoWindow Google.maps.InfoWindow
     * @param {string} html Window markup
     */
    function bindInfoWindow(marker, map, infoWindow, html)
    {
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.setContent(html);
            infoWindow.open(map, marker);
        });
    }

    /**
     * Reset Markers
     */
    function resetMarkers() {
        var item;
        for (item in markerArray)
        {
            markerArray[item].setMap(null);
        }
        markerArray.length = 0;
    }

    /**
     * Reset Polyline
     */
    function resetPolyline() {
        var item;
        for (item in polylineArray)
        {
            polylineArray[item].setMap(null);
        }
        polylineArray.length = 0;
    }

    /**
     * Reset Playlist Highlights
     * Removes the green class from the playlist li elements
     */
    function resetPlaylistHighlights() {
        var playlistHighlightsCount = playlistHighlights.length,
                i;
        for(i=0;i<playlistHighlightsCount;i++){
           $("#" + playlistHighlights[i]).removeClass("green"); 
        }
        playlistHighlights.length = 0;
    }

    /**
     * Create Marker
     * Create the marker, bind its info window, change the marker bounds
     * and store in an array for reference for later manipulation.
     * 
     * @param {number} lat
     * @param {number} lng
     * @param {string} header H3 header text
     * @param {string} detail Paragraph text
     */
    function createMarker(lat, lng, header, detail) {
        var newMarker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: context.map,
            optimized: false
        }),
        infoWindow = new google.maps.InfoWindow(),
                html = '<h3 id="infowindow">' + header + '</h3><p class="infowindow">' + detail + '</p>';
        bindInfoWindow(newMarker, context.map, infoWindow, html);
        markerBounds.extend(new google.maps.LatLng(lat, lng));
        context.map.fitBounds(markerBounds);
        markerArray.push(newMarker);
    }

    /**
     * Move Along Path
     * Checks if the distance submitted is within the polyline length
     * using points.
     * 
     * Updated from V2 to V3.
     * @param {array} points Array of Google.maps.LngLats
     * @param {number} distance Meters
     * @param {number} index Count against points
     */
    function moveAlongPath(points, distance, index) {
        index = index || 0;  // Set index to 0 by default.

        if (index < points.length) {
            // There is still at least one point further from this point.
            var polyline = new google.maps.Polyline();
            polyline.getPath().push(new google.maps.LatLng(points[index].jb, points[index].kb));
            if ((index + 1) === points.length) {
                polyline.getPath().push(new google.maps.LatLng(points[index].jb, points[index].kb));
            } else {
                polyline.getPath().push(new google.maps.LatLng(points[index + 1].jb, points[index + 1].kb));
            }
            // Get the distance from this point to the next point in the polyline.
            var distanceToNextPoint = polyline.inKm() * 1000;
            if (distance <= distanceToNextPoint) {
                // distanceToNextPoint is within this point and the next. 
                // Return the destination point with moveTowards().
                return points[index].moveTowards(points[index + 1], distance);
            }
            else {
                // The destination is further from the next point. Subtract
                // distanceToNextPoint from distance and continue recursively.
                return moveAlongPath(points,
                        distance - distanceToNextPoint,
                        index + 1);
            }
        } else {
            // There are no further points. The distance exceeds the length  
            // of the full path. Return null.
            return null;
        }
    }

    /**
     * Get Track Points
     * Creates the long/lats where each track finishes playing based on 
     * googles direction services average speed for the journey, the running time
     * of the music track in seconds and the points(long/lats) of the route.
     * 
     * @param {number} trackListCount Count of the current playlists tracks
     * @param {number} speed
     * @param {object} trackList
     * @param {array} points
     * @returns {Array}
     */
    function getTrackPoints(trackListCount, speed, trackList, points) {
        var nextDistance = 0,
                nextPoints = [],
                nextPoint;
        // Set first marker Start
        moveAlongPath(points, 0);

        // Check if we dealing with Track or Tracks
        if ($.isArray(trackList.track)) {
            for (i = 0; i < trackListCount; i++) {
                // Next Distance add speed * track duration in seconds
                nextDistance += speed * trackList.track[i].msDuration.dcs;
                nextPoint = moveAlongPath(points, nextDistance);
                // Handle instance where route is shorter then total track duration
                if (nextPoint === null) {
                    return nextPoints;
                }
                nextPoint.track = trackList.track[i].title;
                nextPoint.sequence = trackList.track[i].sequence;
                nextPoints.push(nextPoint);
            }
            return nextPoints;
        } else {
            nextDistance += speed * trackList.track.msDuration.dcs;
            nextPoint = moveAlongPath(points, nextDistance);
            if (!(nextPoint instanceof google.maps.LatLng)) {
                return nextPoints;
            }
            nextPoint.track = trackList.track.title;
            nextPoint.sequence = trackList.track.sequence;
            nextPoints.push(nextPoint);
        }
    }

    /**
     * Build Route
     * Makes the request to the google directions service, creates the polyline of the route,
     * creates the markers and the playlist highlighting
     * 
     * @param {string} from Hackney Way, Westbury
     * @param {string} destination Short Street, Melksham
     * @param {string} travelMode BICYCLING|DRIVING|WALKING
     * @param {object} trackList
     * @param {number} trackListCount
     */
    function buildRoute(from, destination, travelMode, trackList, trackListCount) {
        var selectedTravelMode;
        switch (travelMode) {
            case "BICYCLING":
                selectedTravelMode = google.maps.DirectionsTravelMode.BICYCLING;
                break;
            case "DRIVING":
                selectedTravelMode = google.maps.DirectionsTravelMode.DRIVING;
                break;
            case "WALKING":
                selectedTravelMode = google.maps.DirectionsTravelMode.WALKING;
                break;
        }
        var request = {
            origin: from,
            destination: destination,
            travelMode: selectedTravelMode,
            unitSystem: google.maps.DirectionsUnitSystem.METRIC
        },
        polyline = new google.maps.Polyline({
            path: [],
            strokeColor: '#FF6600',
            strokeWeight: 3
        }),
        directionsService = new google.maps.DirectionsService();
        directionsService.route(request, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                var overviewPathCollection = response.routes[0].overview_path,
                        overviewPathCollectionCount = overviewPathCollection.length,
                        i,
                        points = [];
                for (i = 0; i < overviewPathCollectionCount; i++) {
                    polyline.getPath().push(new google.maps.LatLng(overviewPathCollection[i].jb, overviewPathCollection[i].kb));
                    points.push(new google.maps.LatLng(overviewPathCollection[i].jb, overviewPathCollection[i].kb));
                    if (i === 0) {
                        createMarker(overviewPathCollection[i].jb, overviewPathCollection[i].kb, 'Route Start', '');
                    }
                    if (i === (overviewPathCollectionCount - 1)) {
                        createMarker(overviewPathCollection[i].jb, overviewPathCollection[i].kb, 'Route End', '');
                    }
                }
        
                polyline.setMap(context.map);
                polylineArray.push(polyline);
                var distance = response.routes[0].legs[0].distance.value,
                        duration = response.routes[0].legs[0].duration.value,
                        speed = distance.toFixed(1) / Math.floor(duration),
                        markerPoints,
                        markerPointsCount;

                if (trackListCount > 0) {
                    // trackList is array
                    markerPoints = getTrackPoints(trackListCount, speed, trackList, points);
                    markerPointsCount = markerPoints.length;
                    for (i = 0; i < markerPointsCount; i++) {
                        createMarker(markerPoints[i].jb, markerPoints[i].kb, markerPoints[i].track, 'Track Finishes Playing Here.');
                        $("#" + markerPoints[i].sequence).addClass("green");
                        playlistHighlights.push(markerPoints[i].sequence);
                    }
                }
            }
        });
        //polyline.setEditable(true);
        
        /*google.maps.event.addListener(polyline, 'capturing_changed', function() {
            var array = polyline.getPath(); //getPath() gives u array of current markers latlng over map 

            var tempDistance = 0;

            var tempPathArray = [];

            for (i = 0; i < array.length; i++) {

                tempPathArray.push(array.getAt(i));

            }
console.log("Event Fired");

            for (k = 1; k < tempPathArray.length; k++)

            {


                var calculateNewDistance = google.maps.geometry.spherical.computeDistanceBetween(tempPathArray[k - 1], tempPathArray[k]);

                tempDistance += calculateNewDistance;

            }
        });*/
    }

    context.init = function() {
        var latlng = new google.maps.LatLng('51.382066781130575', '-2.14508056640625');
        var myOptions = {
            zoom: 10,
            center: latlng,
            scaleControl: true,
            mapTypeControl: false,
            //navigationControl: false,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
            //draggableCursor: 'auto',
	    //draggingCursor: 'move',
	    //disableDoubleClickZoom: true
        };
        context.map = new google.maps.Map(document.getElementById("mapcanvas"), myOptions);


        context.handleBuildRoute = function(from, to, travelMode, trackList, trackListCount) {
            resetMarkers();
            resetPlaylistHighlights();
            resetPolyline();
            buildRoute(from, to, travelMode, trackList, trackListCount);
        };
    };
})(tdapi.gmap);

// Prototype Extensions to global objects

/**
 * Adds To Radius for haversine calculations
 * @returns {Number|Number.prototype|@exp;Math@pro;PI}
 */
Number.prototype.toRad = function() {
    return this * Math.PI / 180;
};

/**
 * Adds to Degrees for haversine calculations
 * @returns {Number|@exp;Math@pro;PI|Number.prototype}
 */
Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
};

/**
 * Move Towards
 * Calculates a long lat from a set distance from a point (long/lat)
 * 
 * @param {object} point Google.LatLng
 * @param {number} distance Meters
 * @returns {@exp;google@pro;maps@call;LatLng}
 */
google.maps.LatLng.prototype.moveTowards = function(point, distance) {
    var lat1 = this.lat().toRad(),
            lon1 = this.lng().toRad(),
            lat2 = point.lat().toRad(),
            lon2 = point.lng().toRad(),
            dLon = (point.lng() - this.lng()).toRad();

    var brng = Math.atan2(
            Math.sin(dLon) * Math.cos(lat2),
            Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
            );
    var angDist = distance / 6371000;
    lat2 = Math.asin(Math.sin(lat1) * Math.cos(angDist) +
            Math.cos(lat1) * Math.sin(angDist) *
            Math.cos(brng));

    lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(angDist) *
            Math.cos(lat1),
            Math.cos(angDist) - Math.sin(lat1) *
            Math.sin(lat2));

    if (isNaN(lat2) || isNaN(lon2))
        return null;

    return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());
};

/**
 * kmTo
 * @see inKm
 */
google.maps.LatLng.prototype.kmTo = function(a) {
    var e = Math, ra = e.PI / 180;
    var b = this.lat() * ra, c = a.lat() * ra, d = b - c;
    var g = this.lng() * ra - a.lng() * ra;
    var f = 2 * e.asin(e.sqrt(e.pow(e.sin(d / 2), 2) + e.cos(b) * e.cos
            (c) * e.pow(e.sin(g / 2), 2)));
    return f * 6378.137;
};

/**
 * In Kilometers
 * Returns a distance in kilometers to get around the loss 
 * of polylines get length (total polyline length) method in API v3.
 * Other work arounds for this dont seem as accurate as this even though returning km when dealing 
 * with meters is not ideal.
 * 
 * @link http://stackoverflow.com/questions/4480195/get-length-of-polyline-in-google-maps-v3
 * @param {number} n optional path number
 * @returns {Number} dist distance in km
 */
google.maps.Polyline.prototype.inKm = function(n) {
    var a = this.getPath(n), len = a.getLength(), dist = 0;
    for (var i = 0; i < len - 1; i++) {
        dist += a.getAt(i).kmTo(a.getAt(i + 1));
    }
    return dist;
};
        