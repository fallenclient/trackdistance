var tdapi = tdapi || {};
tdapi.trackdistance = tdapi.trackdistance || {};
(function(context) {
    var url = window.location.href.split("?"),
        token,
		playlistProvider;
	
	function selectPlaylist(value) {
		playlistProvider.handlePlaylistSelect(value);
	}
	
	function selectPlaylistProvider(value) {
		//if (typeof tdapi[value] !== "undefined" ) {
		if (value in tdapi) {
			playlistProvider = tdapi[value];
			if (playlistProvider.tokenReq && typeof token === "undefined") {
				playlistProvider.getToken();
			}else if (playlistProvider.tokenReq) {
				console.log(token);
				playlistProvider.setToken(token[1]);
				playlistProvider.init();
			}else{
				playlistProvider.init();
			}
		} else {
			// provider doesnt exist
			console.log("Provider Doesnt Exist");
		}
	}
	
	function updateRoute(travelMode, avgSpeedMetric, avgSpeed) {
		//travelMode, avgSpeed, avgSpeedMetric, trackList, trackListCount
		//tdapi.lastfm.getTrackList(), tdapi.lastfm.getTrackListCount()
		tdapi.gmap.updateTracks(
				travelMode, avgSpeed, avgSpeedMetric, playlistProvider.getTrackList(), playlistProvider.getTrackListCount()
				);
	}
	
    context.init = function() {
        if (url.length > 1) {
            token = url[1].split("=");
			console.log(token);
			console.log(url);
            tdapi.gmap.init();
        } else {
            //@HACK: Some Playlist Providers wont need a token
            // No Token warn the user
            $('#status').html(
                    "<strong>Warning!</strong> No token found. Are you sure your logged in to LastFm? Return to the index page <a href='index.html'>here</a>"
                    );
            $('#alertstatus').addClass('alert-error');
            $('.alert').show();
        }
    };
    
	context.handlePlaylistProviderSelect = function(value) {
		selectPlaylistProvider(value);
	};
	
    context.handlePlaylistSelectClick = function(value) {
        selectPlaylist(value);
    };
	
	context.handleRouteUpdate = function() {
		//travelmode.val(), parseFloat(avgSpeed), avgSpeedMetric.val()
		var travelMode = $("#travelmode").find('option').filter(":selected"),
        avgSpeedMetric = $("#speedtype").find('option').filter(":selected"),
        avgSpeed = $("#avgspeed").val();
		updateRoute(travelMode, avgSpeedMetric, avgSpeed);
	};
})(tdapi.trackdistance);

$("#playlistselect").click(function() {
    $("#output").val("");
    var option = $("#playlists").find('option').filter(":selected");
    tdapi.lastfm.handlePlaylistSelect(option.val());
// @todo get list of tracks back for construction
// Call echonest functions pass in tracks to get bpm for each
});

$("#playlistpro").change(function() {
	var option = $("#playlistpro").find('option').filter(":selected");
	console.log(option.val());
	if (option.val() !== "select") {
		tdapi.trackdistance.handlePlaylistProviderSelect(option.val());
	}
});

$(document).on("routeUpdate", tdapi.trackdistance.handleRouteUpdate);

