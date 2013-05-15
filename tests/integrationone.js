define([
	'intern!object',
	'intern/chai!assert',
	'require'
], function (registerSuite, assert, require) {
	//var request,
	//	url = 'http://www.fishblade.co.uk/theintern/intern';

	registerSuite({
		name: 'demo',

		'submit form': function () {
			return this.remote
				.get(require.toUrl('index.html'))
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
				//.elementById('operation')
				//	.click()
				//	.type('hello, world')
				//.end()
				//.elementById('submit')
				//	.click()
				//.end()
				//.waitForElementById('result')
				//.text()
                                .elementById('playlists')
				.then(function (playlistElements) {
					assert.equal(playlistElements.length, '9', 'Should be items in the playlist once authenticated');
				});
		}
	});
});