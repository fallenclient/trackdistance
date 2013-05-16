define([
	'intern!object',
	'intern/chai!assert',
	'require'
], function (registerSuite, assert, require) {

	registerSuite({
		name: 'integrationone',

		'sign in': function () {
			return this.remote
				.get(require.toUrl('./public_html/index.html'))
                                .waitForElementByClassName('username')
                                .elementById('username')
                                        .click()
                                        .type('fallenclient01')
                                        .end()
                                .elementById('password')
                                        .click()
                                        .type('Gigasmasher01')
                                        .end()
                                .elementByClassName('button confirmButton')
                                        .click()
                                        .end()
                                .takeScreenshot()
                                .elementById('playlists')
				.then(function (playlistElements) {
					assert.equal(playlistElements.length, '9', 'Should be items in the playlist once authenticated');
				});
		}
	});
});