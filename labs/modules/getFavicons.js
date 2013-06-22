function makeURI(aURL, aOriginCharset, aBaseURI) {
  var ioService = Cc["@mozilla.org/network/io-service;1"]
                  .getService(Ci.nsIIOService);
  return ioService.newURI(aURL, aOriginCharset, aBaseURI);
}

var AsyncFavicons : Cc["@mozilla.org/browser/favicon-service;1"]
                 	.getService(Ci.mozIAsyncFavicons);


function getFaviconCallBack(aURI, aDataLen, aData, aMimeType) {
	console.log(aURI);
}

fav_URI = makeURI(site_URL, null, null);

AsyncFavicons.getFaviconURLForPage(fav_URI, getFaviconCallBack);

