define([
    'intern!tdd',
    'intern/chai!assert',
    '../public_html/js/tdapi.distance-0.1.0.js'
], function(tdd, assert) {
    with (tdd) {
        suite('distance', function() {

            // before the suite starts
            before(function() {
                distance = tdapi.distance;
            });

            // before each test executes
            beforeEach(function() {
                distance.reset();
            });

            // after the suite is done
            after(function() {
                //request.cleanup();
            });

            // multiple methods can be registered and will be executed in order of registration
            after(function() {
                //if (!request.cleaned) {
                //	throw new Error('Request should have been cleaned up after suite execution.');
                //}

                // these methods can be made asynchronous as well by returning a promise
            });

            test('#getDistanceMPHToMS', function() {
                assert.equal(distance.convert(12).from('mph').to('ms'), '5.364467', "Distance from MPH to Metres a Second should match");
                assert.equal(distance.convert(15).from('mph').to('ms'), '6.705583', "Distance from MPH to Metres a Second should match");
                assert.equal(distance.convert(120).from('mph').to('ms'), '53.644667', "Distance from MPH to Metres a Second should match");
                assert.equal(distance.convert(0.45).from('mph').to('ms'), '0.201167', "Distance from MPH to Metres a Second should match");
            });

            test('#getDistanceKPHToMS', function() {
                assert.equal(distance.convert(12).from('kph').to('ms'), '3.333333', "12 KPH to Metres a Second value doesnt match");
                assert.equal(distance.convert(15).from('kph').to('ms'), '4.166667', "15 KPH to Metres a Second value doesnt match");
                assert.equal(distance.convert(120).from('kph').to('ms'), '33.333333', "120 KPH to Metres a Second value doesnt match");
                assert.equal(distance.convert(0.45).from('kph').to('ms'), '0.125000', "0.45 KPH to Metres a Second value doesnt match");
            });

            test('#getDistanceMSToMPH', function() {
                assert.equal(distance.convert(20).from('ms').to('mph'), '44.738837', "");
                assert.equal(distance.convert(5).from('ms').to('mph'), '11.184709', "");
                assert.equal(distance.convert(0.45).from('ms').to('mph'), '1.006624', "");
            });

            test('#getDistanceMSToKPH', function() {
                assert.equal(distance.convert(20).from('ms').to('kph'), '72.000000', "");
                assert.equal(distance.convert(5).from('ms').to('kph'), '18.000000', "");
                assert.equal(distance.convert(0.45).from('ms').to('kph'), '1.620000', "");
            });
            
            test('#unexpectedValues', function() {
                assert.equal(distance.convert("AA").from('mph').to('ms').message, 'Distance Convert Expects a Number.', "Should catch non number error");
                assert.equal(distance.convert(12).from('dph').to('ms').message, 'Cannot call method \'ms\' of undefined', "Unexpected uncatched error.");
                assert.equal(distance.convert(12).from('mph').to('ss').message, 'Object #<Object> has no method \'ss\'', "Unexpected uncatched error.");
                assert.equal(distance.convert(12).from('MPH').to('MS'), '5.364467', "Unexpected uncatched error.");
            });
// Brilliant! 12/3600*1609.34 = 5.36 which is spot on. Thanks Val
// OK, there are 3600 seconds per hour - so 12/3600 = 0.00333333333 
// gives you km per second, x by 1000 to give you meters from km. So
//  kph to meters per second is: distance / 3.6.... (this accounts for the conversion to meters from kms) Does that help? 12/3.6 = 3.333
        });
    }
});