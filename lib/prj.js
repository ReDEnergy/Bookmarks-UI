// JavaScript Document


// **********************************************************************************
//	*	Register about:homepage

//const {AboutHandler, ProtocolHandler} = require('protocol');

/*  let protocol = {
    about: function(about, handler) {
      return AboutHandler.extend(handler, { scheme: about }).new()
    },
    protocol: function(scheme, handler) {
      return ProtocolHandler.extend(handler, { scheme: scheme }).new()
    }
  }
  const aboutCheevosUrl = "about:marks";
  
	let aboutCheevosHandler = protocol.about('marks', {
    	onRequest: function(request, response) {
			log("about cheevos request");
			response.uri = data.url("home/home.html");
		}
	});

  aboutCheevosHandler.register();  
*/
	
//var about = aboutFactory.createInstance(null, Ci.nsIAboutModule);
//AboutHandler.extend(null, { scheme: "marks" }).new();

function makeURI(aURL, aOriginCharset, aBaseURI) {  
	var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
	return ioService.newURI(aURL, aOriginCharset, aBaseURI);
}

function AboutMarks() { }
AboutMarks.prototype = {
	getURIFlags: function(aURI) {  
		return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;  
	}, 	
	
	QueryInterface: xpcom.utils.generateQI([Ci.nsIAboutModule]),
	
	newChannel : function (aURI) {
		let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
		var channel = ios.newChannel("http://www.google.ro/" , null, null);
		return channel; 
	}
};

xpcom.register({
	name: "about:marks",
	contractID: "@mozilla.org/network/protocol/about;1?what=marks",
	create: AboutMarks
});

function ProtocolMarks() { }
ProtocolMarks.prototype = {
	scheme: "k",	
	defaultPort: -1,
	
	allowPort: function(port, scheme) {
		return false
	},

	protocolFlags: Ci.nsIProtocolHandler.URI_NORELATIVE |
					Ci.nsIProtocolHandler.URI_NOAUTH |
					Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

	newURI: function makeURI(aURL, aOriginCharset, aBaseURI) {  
				var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
				return ioService.newURI(aURL, aOriginCharset, aBaseURI);
			},
			
	newChannel: function(aURI) {  
		let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
		var channel = ios.newChannel("http://www.google.ro/" , null, null);
		return channel; 
	}
}

			
var factory = xpcom.getClass("@mozilla.org/network/protocol;1?name=marks", Ci.nsIFactory);	
console.log(factory);
/*
	onRequest: function(request, response) {
	response.uri = data.url("cheevo.html");
*/


//		channel.originalURI = aURI;  
		/* Get twitterName from URL */
//		var twitterName = aURI.spec.split(":")[1];
//		var uri = ios.newURI("http://twitter.com/" + twitterName, null, null);
//		var channel = ios.newChannelFromURI(uri, null).QueryInterface(Ci.nsIHttpChannel);
		/* Determines whether the URL bar changes to the URL */
//		channel.setRequestHeader("X-Moz-Is-Feed", "1", false);
//		return channel;
