var map;
var custom; 

var myOptions = {
    zoom: 6,
    center: new google.maps.LatLng(52.87916, 18.32910),
    mapTypeId: 'terrain'
};
var markers = [];

$(function() {
  map = new google.maps.Map($('#map')[0], myOptions);
  custom = new customDirectionsRenderer(new google.maps.LatLng(50.87916, 16.32910), new google.maps.LatLng(52.87916, 16.32910), map);
    
    //you have access to marker :)
    custom.startMarker.setTitle('POLAND!!');
});

function customDirectionsRenderer(startPoint, endPoint, map) {
    //!!!!! reference to our class
    var that = this;

    this.directionsDisplay = new google.maps.DirectionsRenderer({
        draggable: true,
        suppressMarkers: true,
        map: map
    });

    google.maps.event.addListener(this.directionsDisplay, 'directions_changed', function () {
        checkWaypoints();
    });

    this.directionsService = new google.maps.DirectionsService();

    var draggedMarker;
    var waypointsMarkers = new Array();
    this.map = map;
    this.polyline = '';
    this.polylinePoints = [];

    //<-- create Start and Stop Markers
    this.startMarker = new google.maps.Marker({
        position: startPoint,
        title: 'Start',
        map: map,
        draggable: true,
        optimized: false
    });

    this.endMarker = new google.maps.Marker({
        position: endPoint,
        title: 'End',
        map: map,
        draggable: true,
        optimized: false
    });
    //-->

    //<-- add events listeners to Start/Stop Markers
    google.maps.event.addListener(this.startMarker, 'dragend', dragEnd);
    google.maps.event.addListener(this.startMarker, 'dragstart', dragStart);
    google.maps.event.addListener(this.startMarker, 'drag', drag);
    google.maps.event.addListener(this.endMarker, 'dragend', dragEnd);
    google.maps.event.addListener(this.endMarker, 'dragstart', dragStart);
    google.maps.event.addListener(this.endMarker, 'drag', drag);
    //-->

    //<-- update directionsRenderer true - snap markers to nearest streets
    update(true);
    //-->

    //<--privates
    ////<-- event handlers
    function dragStart() {
        draggedMarker = this;
    }

    function dragEnd() {
        clearTimeout(this.timeout);
        update(true);
    }

    function drag() {
        if (this.timeout !== undefined) {
            return;
        }
        this.timeout = setTimeout(function () { update(false); }, 200);
    }
    ////-->

    ////<-- create draggable markers for Waypoints from given array of latlng objects
    function createWaypointsMarkers(wpoints) {
        $.each(waypointsMarkers, function (idx, obj) {
            obj.setMap(null);
        });
        waypointsMarkers = [];

        $.each(wpoints, function (idx, obj) {
            var marker = new google.maps.Marker({
                position: obj,
                map: that.map,
                draggable: true,
                optimized: false,
                title: idx.toString()
            });
            waypointsMarkers.push(marker);

            google.maps.event.addListener(marker, 'dragend', dragEnd);
            google.maps.event.addListener(marker, 'dragstart', dragStart);
            google.maps.event.addListener(marker, 'drag', drag);
        });
    }
    ////-->

    ////-->  check if new waypoint was created
    function checkWaypoints() {
        if (that.directionsDisplay.getDirections() !== undefined) {
            if (waypointsMarkers.length !=
                that.directionsDisplay.getDirections().routes[0].legs[0].via_waypoints.length) {
                createWaypointsMarkers(that.directionsDisplay.getDirections().routes[0].legs[0].via_waypoints);
            }
        }
    }
    ////-->

    ////--> Update directionsRenderer when move or drop marker 
    ////bool setMarkersPositions - snap markers to nearest streets?
    function update(setMarkersPositions) {
        if (draggedMarker !== undefined) {
            draggedMarker.timeout = undefined;
        }
        that.directionsDisplay.preserveViewport = true;

        checkWaypoints();

        var waypoints = [];
        $.each(waypointsMarkers, function (idx, obj) {
            waypoints.push({ location: obj.getPosition(), stopover: false });
        });

        var request = {
            origin: that.startMarker.getPosition(),
            destination: that.endMarker.getPosition(),
            waypoints: waypoints,
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        };

        that.directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                that.directionsDisplay.setDirections(response);

                if (waypointsMarkers.length != response.routes[0].legs[0].via_waypoints.length) {
                    createWaypointsMarkers(response.routes[0].legs[0].via_waypoints);
                }

                if (setMarkersPositions) {
                    that.startMarker.setPosition(response.routes[0].legs[0].start_location);
                    that.endMarker.setPosition(response.routes[0].legs[0].end_location);
                    $.each(response.routes[0].legs[0].via_waypoints, function (idx, obj) {
                        waypointsMarkers[idx].setPosition(obj);
                    });
                    that.polyline = response.routes[0].overview_polyline.points;
                    that.polylinePoints = response.routes[0].overview_path;
                }
            }
        });
    }
    ////-->
    //-->
}
customDirectionsRenderer.prototype = new google.maps.MVCObject();