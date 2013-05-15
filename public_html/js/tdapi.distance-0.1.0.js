/*jshint*/
/** ==TDAPI Google Maps API Handler==
 * Google Maps API functions for TDAPI
 * Event Handlers, Data Manipulation and Page Presentation
 * @version 0.1.0.XX
 * @author David Fisher <dave@fishblade.co.uk>
 * @package tdapi
 */
var tdapi = tdapi || {};
tdapi.distance = tdapi.distance || {};
(function(context) {
    var distance = 0,
            from,
            error = "";
    conv = {
        kph: {
            ms: function() {
                var calc = distance / 3600 * 1000;
                return calc.toFixed(6);
            }
        },
        mph: {
            ms: function() {
                var calc = distance / 3600 * 1609.34;
                return calc.toFixed(6);
            }
        },
        ms: {
            mph: function() {
                var calc = distance * 3600 / 1609.34;
                return calc.toFixed(6);
            },
            kph: function() {
                var calc = distance * 3600 / 1000;
                return calc.toFixed(6);
            }
        }
    };

    function handleFrom(unit) {
        from = unit.toLowerCase();
    }
    ;

    function InvalidConvert(message) {
        this.message = message;
    }
    

    InvalidConvert.prototype = new Error();
//ex instanceof ReferenceError
    context.convert = function(avgSpeed) {
        try {
            if (typeof avgSpeed !== 'number') {
                throw new InvalidConvert("Distance Convert Expects a Number.");
            } else {
                distance = avgSpeed;
            }
        } catch (ex) {
            distance = 0;
            error = ex;
        }
        return this;
    };

    context.from = function(unit) {
        handleFrom(unit);
        return this;
    };

    context.to = function(unit) {
        if (error.length === 0) {
            try {
                return conv[from][unit.toLowerCase()](distance);
            } catch (ex) {
                return ex;
            }
        } else {
            var issue = error;
            error = "";
            return issue;
        }
    };

    context.reset = function() {
        error = "";
    };
})(tdapi.distance);
/*var from = {
 metre:{
 km: function(){
 console.log("Its KM Jim!");
 }
 } 
 };*/


