/*jshint*/
/** ==TDAPI LastFM API Handler==
 * LastFM API functions for TDAPI
 * Event Handlers, Data Manipulation and Page Presentation
 * @version 0.1.0.XX
 * @author David Fisher <dave@fishblade.co.uk>
 * @package tdapi
 */
var tdapi = tdapi || {};
tdapi.lastfm = tdapi.lastfm || {};
(function(context, $, CryptoJS) {
    var APIKEY = '2420123bc3ba8126a3053b45f08ea829',
            SECRET = 'c6e6232262f55b2cc4a3f52f05c3892d',
            token,
            sessionKey,
            currentUser,
            trackList,
            trackListCount,
            originalTrackList = {};

    function beginLastFmLogin() {
        window.location = "http://www.last.fm/api/auth/?api_key=" + APIKEY;
    }
    /**
     * Create Hash
     * Creates the hash for the auth.getSession call
     * @param {string} method Api method
     * @returns {@exp;CryptoJS@call;MD5}
     */
    function createHash(method) {
        var hashRequest = "api_key" + APIKEY + "method" + method + "token" + token + SECRET;
        return CryptoJS.MD5(hashRequest);
    }
    /**
     * Set Authentication Session
     */
    function setAuthGetSession() {
        var hash = createHash("auth.getSession");
        $.ajax({
            url: "http://ws.audioscrobbler.com/2.0/?method=auth.getSession",
            data: "token=" + token + "&api_key=" + APIKEY + "&api_sig=" + hash + "&format=json",
            dataType: 'json',
            success: function(data) {
                if (!(data.hasOwnProperty("error"))) {
                    sessionKey = data.session.key;
                    currentUser = data.session.name;
                    getUserPlaylists();
                } else {
                    $('#status').html(
                            "<strong>Error: </strong> " + data.message +" Return to the index page <a href='index.html'>here</a> to try again."
                            );
                    $('#alertstatus').addClass('alert-error');
                    $('.alert').show();
                }
            },
            error: function(data) {
                // @todo - Add error code handling
            }
        });
    }

    /**
     * Get User Playlists
     */
    function getUserPlaylists() {
        $.ajax({
            url: "http://ws.audioscrobbler.com/2.0/?method=user.getplaylists",
            data: "user=" + currentUser + "&api_key=" + APIKEY + "&format=json",
            dataType: 'json',
            success: function(data) {
                if (!(data.hasOwnProperty("error"))) {
                    var playlists = data.playlists,
                            source = $("#playlists-template").html(),
                            playlistTemplate = Handlebars.compile(source);
                    $("#playlists").empty().html(playlistTemplate(playlists));
                } else {
                    $("#output").val($("#output").val() + " Error: " + data.error + " Message: " + data.message + "\n");
                }
            },
            error: function(data) {

            }
        });
    }

    /**
     * Create User Playlist
     * Creates a new playlist and then loops through the trackList adding each track
     * in array key order.
     * 
     * @param {string} title
     * @param {string} description
     */
    function createUserPlaylist(title, description) {
        var hashPlaylistRequest = "api_key" + APIKEY + "description" + description + "methodplaylist.createsk" + sessionKey + "title" + title + SECRET;
        $.ajax({
            url: "http://ws.audioscrobbler.com/2.0/?format=json",
            type: 'POST',
            dataType: 'json',
            data: "method=playlist.create&title=" + title + "&description=" + description + "&api_key=" + APIKEY + "&sk=" + sessionKey + "&api_sig=" + CryptoJS.MD5(hashPlaylistRequest),
            success: function(data) {
                if (!(data.hasOwnProperty("error"))) {
                    var newId = data.playlists.playlist.id,
                            i;
                    for (i = 0; i < trackListCount; i++) {
                        addUserPlaylistTrack(newId, trackList.track[i].title, trackList.track[i].creator);
                    }
                } else {
                    $("#output").val($("#output").val() + " Error: " + data.error + " Message: " + data.message + "\n");
                }
            }
        }).done(function() {
            $("#output").val($("#output").val() + " Playlist: " + title + " Saved\n");
        });
    }

    /**
     * Add User Playlist Track
     * 
     * @see createUserPlaylist
     * @param {int} id
     * @param {string} track
     * @param {string} artist
     */
    function addUserPlaylistTrack(id, track, artist) {
        var hashTrackRequest = "api_key" + APIKEY + "artist" + artist + "methodplaylist.addTrackplaylistID" + id + "sk" + sessionKey + "track" + track + SECRET;
        $.ajax({
            url: "http://ws.audioscrobbler.com/2.0/?format=json",
            type: 'POST',
            async: false,
            data: "method=playlist.addTrack&playlistID=" + id + "&track=" + track + "&artist=" + artist + "&api_key=" + APIKEY + "&sk=" + sessionKey + "&api_sig=" + CryptoJS.MD5(hashTrackRequest),
            success: function(data) {
                if (data.hasOwnProperty("error")) {
                    $("#output").val($("#output").val() + " Error: " + data.error + " Message: " + data.message + "\n");
                }
            }
        });
    }

    /**
     * Sort the track list
     * Assigns the trackList order based on ids key array.
     * Would be more efficient if sequence obj property was used instead.
     * 
     * @param {array} ids - Key array
     */
    function sortTrackList(ids) {
        var tracks = originalTrackList.track,
                i,
                result = [];
        for (i = 0; i < tracks.length; i++) {

            result[i] = tracks[ids[i]];
        }
        trackList.track = result;
    }

    /**
     * Get User Playlist 
     * @param {int} id
     */
    function getUserPlaylist(id) {
        $.ajax({
            url: "http://ws.audioscrobbler.com/2.0/?method=playlist.fetch",
            data: "playlistURL=lastfm://playlist/" + id + "&api_key=" + APIKEY + "&format=json",
            dataType: 'json',
            success: function(data) {
                if (!(data.hasOwnProperty("error"))) {
                    originalTrackList.track = data.playlist.trackList.track;
                    trackList = data.playlist.trackList;

                    // Use handlebars template tracklist for li elements for each track
                    var source = $("#tracklist-template").html(),
                            trackListTemplate = Handlebars.compile(source),
                            seconds,
                            minutes;

                    // trackList.track could be an object or an array
                    if ($.isArray(trackList.track)) {
                        trackListCount = trackList.track.length;
                        var i;
                        for (i = 0; i < trackListCount; i++) {

                            /*
                             * Gmaps distance calculation uses unformatted seconds - distanceCalcSeconds
                             * Playlist display uses the formatted seconds - seconds
                             */
                            distanceCalcSeconds = Math.floor(trackList.track[i].duration / 1000),
                                    minutes = Math.floor(distanceCalcSeconds / 60);
                            seconds = distanceCalcSeconds % 60;
                            trackList.track[i].msDuration = {m: minutes, s: seconds, dcs: distanceCalcSeconds};
                            trackList.track[i].formattedDuration = minutes + '.' + seconds;
                            trackList.track[i].sequence = i + 1;
                        }

                    } else if (!$.isEmptyObject(trackList.track)) {
                        // single object
                        trackListCount = 0;
                        seconds = Math.floor(trackList.track.duration / 1000),
                                minutes = Math.floor(seconds / 60);
                        seconds = seconds % 60;
                        trackList.track.msDuration = {m: minutes, s: seconds};
                        trackList.track.formattedDuration = minutes + '.' + seconds;
                        trackList.track.sequence = 1;
                    } else {
                        $("#output").val($("#output").val() + "Sorry this playlist is empty! \n");
                    }
                    $("#tracklist").html(trackListTemplate(trackList));
                    // Initialize drag and drop now we have the track list li's loaded
                    tdapi.dandd.init();
                    
                } else {
                    $("#output").val($("#output").val() + " Error: " + data.error + " Message: " + data.message + "\n");
                }
            },
            error: function(data) {
                //@todo - Handle HTTP error codes
            }
        });
    }
	
	context.tokenReq = function() {
		return true;
	};

    context.init = function() {
        //beginLastFmLogin();
		setAuthGetSession();
    };
	
	context.getToken = function() {
		beginLastFmLogin();
	};

    context.setToken = function(tokenString) {
        token = tokenString;
    };
	
	context.trackListCount = function() {
		return trackListCount;
	};

    context.handleUserSession = function() {
        //setAuthGetSession();
    };
    context.handlePlaylistSelect = function(id) {
        getUserPlaylist(id);
    };
    context.getTrackList = function() {
        return trackList;
    };
    context.getTrackListCount = function() {
        return trackListCount;
    };
    context.handleSortTrackList = function(ids) {
        sortTrackList(ids);
    };
    context.handleNewPlayList = function(title, description) {
        createUserPlaylist(title, description);
    };
})(tdapi.lastfm, jQuery, CryptoJS);
console.log(CryptoJS);