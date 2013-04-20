AsyncLivemarks	: Cc["@mozilla.org/browser/livemark-service;2"]
					.getService(Ci.mozIAsyncLivemarks);

ioService		: Cc["@mozilla.org/network/io-service;1"]
					.getService(Ci.nsIIOService);

// *	Return a new nsIURI
makeURI: function makeURI(aURL) {
	return this.ioService.newURI(aURL, null, null);
};