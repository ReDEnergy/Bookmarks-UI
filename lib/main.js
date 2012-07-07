/*
 * Title			Bookmark UI 
 * Programmer		Gabriel Ivanica
 * Email			gabriel.ivanica@gmail.com
 * Website			
 * Description
 */


/*	
 * CommonJS Module import
 */

var data = require("self").data;
var ss = require("simple-storage").storage;
var tabs = require("tabs");
var {Cc, Ci} = require("chrome");
const {Hotkey} = require("hotkeys");

/*	
 * Global Variables
 */

var panel_hotkey = null;
var Bookmarks = [];

/*
 * Addon Panel for Bookmarks 
 */

var panel = require("panel").Panel({
	contentURL: data.url("panel/panel.html"),
	contentScriptFile: [data.url("jquery-1.7.1.min.js"),
						data.url('panel/panel.js')],
});


var BookmarksUI = {

	// *	Interfaces
	BookmarksServ :	Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
					.getService(Ci.nsINavBookmarksService),
	HistoryServ :	Cc["@mozilla.org/browser/nav-history-service;1"]
					.getService(Ci.nsINavHistoryService),

	// *	Important variables
	ResNode :		Ci.nsINavHistoryResultNode,
	ContResNode :	Ci.nsINavHistoryContainerResultNode,
				
				
	// *	Properties
	places		:	null,
	folderNode	:	null,


	/*
	       ___ ___       __   __   __  
	 |\/| |__   |  |__| /  \ |  \ /__` 
	 |  | |___  |  |  | \__/ |__/ .__/ 
	 
	*/

	// *	Description
	setPlaces : function () {
		this.places.push(this.BookmarksServ.toolbarFolder);
	},

	// *	Description
	initHistroyServ : function () {
		
		var query = this.HistoryServ.getNewQuery();
		var queryOptions = this.HistoryServ.getNewQueryOptions();
		
		query.setFolders([this.BookmarksServ.toolbarFolder], 1);
		
		var result = this.HistoryServ.executeQuery(query, queryOptions);

		this.folderNode = result.root;
	},

	// *	Description
	getFolderMarks : function (folderNode) {
		
		folderNode.containerOpen = true;
		var childCount = folderNode.childCount;
	
		for (var i=0; i < childCount; i++) {
			var childNode = folderNode.getChild(i);
	
			if (childNode.type == this.ResNode.RESULT_TYPE_URI) 
				Bookmarks.push(new Mark(childNode));
	
			if (childNode.type == this.ResNode.RESULT_TYPE_FOLDER) {
				Bookmarks.push(new Mark(childNode));
			}
		}
		
		folderNode.containerOpen = false;
		Bookmarks.print();
	}
}

/*
 * Object for storing bookmark info
 */
 
function Mark (childNode) {
	this.id			= childNode.itemId;
	this.position	= childNode.bookmarkIndex;
	this.type		= childNode.type;
//	this.parent		= childNode.parent;
	this.title		= childNode.title;
	this.url		= childNode.uri;
	this.fav		= childNode.icon;
}

Mark.prototype.print = function () {
	var _prop = [];
	_prop.push (this.id, this.position, this.type, this.title);
	console.log (_prop.join(' \t'));
}


Object.prototype.getProperties = function () {
	var prop = [];
	for (var key in this)
		if (this.hasOwnProperty(key))
		 	prop.push(this[key]);
	return prop;
}


Bookmarks.print = function () {
	for (var i=0; i<Bookmarks.length; i++)
		Bookmarks[i].print();
}




BookmarksUI.initHistroyServ();
BookmarksUI.getFolderMarks(BookmarksUI.folderNode);




/**
 **	Mouse events
 **/

panel.port.on ("GetNew", function (parent) {
});

// *	Navigate back to the previous folder
panel.port.on ("GoBack", function (parent) {
});




/*
 * Opening Links
 */

// *	Open a Link 
panel.port.on ("OpenLink", function (url , button) {
	var method = ss.Pref.mouse[button];
	if (method == 0)
		tabs.activeTab.url = url; 
	if (method == 1)
		tabs.open(url); 
});

// *	Open all links from the same folder
panel.port.on ("OpenAll", function() {
	for (var i in Marks)
		if (Marks[i].type == 1)
			tabs.open(Marks[i].url);
});

// **********************************************************************************
// *	Page Mode for mouse gestures

/*
var workers = [];
 
// *	Delete workers when the tab is closed
function detachWorker(worker, workerArray) {
  var index = workerArray.indexOf(worker);
  if(index != -1) {
    workerArray.splice(index, 1);
  }
}

// *	Create worker for each new opened tab
var pageMod = require("page-mod");
pageMod.PageMod({
	include: ["*", "about:*", "file://*", "resource:*"],
	contentScriptFile:[data.url("gestures.js")],
	contentScriptWhen: "ready",
	onAttach: function onAttach(worker) {
		worker.port.on("show", function (){ 
			panel.show();
		});
		worker.on('detach', function () {
		  detachWorker(this, workers);
		});
	}
});
*/

// **********************************************************************************
// *	HotKey for show/hide Panel

function getcombo( vector) {
	var combo = vector[0];
	if (vector[1]) combo += '-accel';
	if (vector[2]) combo += '-alt';
	if (vector[3]) combo += '-shift';
	return combo;
}

function create_hotkey (string) {
	if (panel_hotkey)	
		panel_hotkey.destroy();
	
	panel_hotkey = Hotkey({
		combo: string,
		onPress: function() {
			if(panel.isShowing)
				panel.hide();
			else panel.show();
		}
	});
}

// **********************************************************************************
//	*	About and Settings Page - with Page Worker

var HomePage = require("page-mod");
HomePage.PageMod({		 
	include: data.url("home/home.html"),
	contentScriptFile: [data.url("jquery-1.7.1.min.js"),
						data.url("home/worker.js")],
	contentScriptWhen: "end",
	onAttach: function onAttach(worker) {
		worker.port.on ("apply", function (Pref){
			ss.Pref = Pref;
			Preferences.set(Pref)
		});
		// *	Get current settings
		worker.port.emit ("CurrentPref", ss.Pref );
	}
});

// **********************************************************************************
// *	Persistent Storage - Save Preferences And Restore

var Preferences = {
	standard : {
		mark:	170,
		number:	2,
		height:	400,
		combo:	['Q', 1, 0, 0],
		mouse:	[0, 1, 1],
		version: 1.3,
		image:	'default',
	},
	
	start : function () {
		if (ss.Pref && ss.Pref.version == this.standard.version)
			this.set(ss.Pref);
		else {
			this.set(this.standard);
			ss.Pref = this.standard;
		}
	},
 
	set	: function (Pref) {
//		this.log(Pref);
		panel.width = Pref.mark * Pref.number;
		panel.height = parseInt(Pref.height);
		create_hotkey(getcombo( Pref.combo));
		panel.port.emit ("NewPref", Pref);
	},
	
	log : function (Pref) {
		console.log ("Pref Start")
		console.log ("Mark: " + Pref.mark);
		console.log ("Number: " + Pref.number);
		console.log ("Height: " + Pref.height);
		console.log ("Combo: " + Pref.combo);
		console.log ("Mouse: " + Pref.mouse);
		console.log ("Version: " + Pref.version);
		console.log ("Image: " + Pref.image);
		console.log ("Pref End");
	}
}

Preferences.start();

// **********************************************************************************
//	*	Open Homepage
panel.port.on ("open_homepage", function () {
	var alreadyOpen = 0;

	// *	Swith to the addon homepage if it is already opened
	for (var i in tabs) {
		if ( tabs[i].url == data.url("home/home.html")) {
			tabs[i].activate();
			alreadyOpen = 1
		}
	}

	// *	Open the homepage 
	if (!alreadyOpen)
		tabs.open ( data.url("home/home.html") );

	panel.hide();
});

// *	Widget
require("widget").Widget({
	id: "Display Panel",
	label: "Show Panel",
	contentURL: data.url("images/icon.png"),  
	onClick : function () {
		panel.show();
	}
});


