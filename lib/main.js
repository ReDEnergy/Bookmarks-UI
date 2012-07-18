/*
 * Title			Bookmarks UI 
 * Programmer		Gabriel Ivanica
 * Email			gabriel.ivanica@gmail.com
 * Description		GUI for interacting with bookmarks
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

var Bookmarks = [];
var panel;
var panel_hotkey;
var workers = [];



// **********************************************************************************
// *	Addon Panel for Bookmarks 
 
panel = require("panel").Panel({
	contentURL: data.url("panel/panel.html"),
	contentScriptFile: [data.url("jquery-1.7.1.min.js"),
						data.url('panel/panel.js')],
});


// *	Widget for Panel
require("widget").Widget({
	id: "UIPanel",
	label: "Bookmarks UI",
	contentURL: data.url("images/icon.png"),  
	onClick : function () {
		panel.show();
	}
});
// **********************************************************************************



// **********************************************************************************
// *	Main Addon Object

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
	query		: 	null,
	queryOptions : 	null,
	folderNode	:	null,
	parent		:	null, 

	/*
	       ___ ___       __   __   __  
	 |\/| |__   |  |__| /  \ |  \ /__` 
	 |  | |___  |  |  | \__/ |__/ .__/ 
	 
	*/

	// *	HistoryService query initialization 
	initHistroyServ : function ( ) {
		
		this.query = this.HistoryServ.getNewQuery();
		this.queryOptions = this.HistoryServ.getNewQueryOptions();
		
	},
	
	// *	Set folder for query
	setQueryFolder : function (folderID) {

		this.parent = folderID;
		this.query.setFolders([folderID], 1);

		var result = this.HistoryServ.executeQuery(this.query, this.queryOptions);
		this.folderNode = result.root;

		Bookmarks.length = 0;

	},
	

	// *	Get all marks from the query folder
	getMarksFrom : function () {
		
		this.folderNode.containerOpen = true;
		
		var childCount = this.folderNode.childCount;
	
		for (var i=0; i < childCount; i++) {
			var childNode = this.folderNode.getChild(i);
	
			if (childNode.type == this.ResNode.RESULT_TYPE_URI || childNode.type == this.ResNode.RESULT_TYPE_FOLDER )

					Bookmarks.push(new Mark(childNode));
		}
		
		// Bookmarks.print();
		
		panel.port.emit("loadMarks", Bookmarks);
	},
	
	
}


// *	Object for storing bookmarks info
function Mark (childNode) {
	this.id			= childNode.itemId;
	this.position	= childNode.bookmarkIndex;
	this.type		= childNode.type;
	this.parent		= BookmarksUI.parent;
	this.title		= childNode.title;
	this.url		= childNode.uri;
	this.fav		= childNode.icon.substring(17);
}

// *	Debug : log marks info
Mark.prototype.print = function () {
	var _prop = [];
	_prop.push (this.id, this.position, this.type, this.parent, this.title, this.fav);
	console.log (_prop.join(' \t'));
}

// *	Debug : log all bookmarks info
Bookmarks.print = function () {
	for (var i=0; i<this.length; i++)
		this[i].print();
}

// *	Open all bookmarks from current folder
Bookmarks.openAll = function () {
	for (var i in this)
		if (this[i].type == 0)
			tabs.open(this[i].url);
}



// *	Navigate back to the previous folder
panel.port.on ("goBack", function (parentID) {
	BookmarksUI.setQueryFolder(parentID);
	BookmarksUI.getMarksFrom();
});


// *	Load bookmarks from folder
panel.port.on ("getMarksFrom", function (folderID) {
	BookmarksUI.setQueryFolder(folderID);
	BookmarksUI.getMarksFrom();
});

// *	Open a Link 
panel.port.on ("openLink", function (url , button) {
	var method = ss.Pref.mouse[button];
	if (method == 0)
		tabs.activeTab.url = url; 
	if (method == 1)
		tabs.open(url); 
});

// *	Open all links from the same folder
panel.port.on ("openAll", function() {
	 Bookmarks.openAll();
});
// **********************************************************************************

// **********************************************************************************
// *	Bookmarks Observer


// Create a bookmark observer
var observer = {
	onBeginUpdateBatch: function() {
		console.log("batch update start");
	// This method is notified when a batch of changes are about to occur.
	// Observers can use this to suspend updates to the user-interface, for example
	// while a batch change is occurring.
	},
	onEndUpdateBatch: function() {
		console.log("batch update end");
		this._inBatch = false;
	},
	onItemAdded: function(id, folder, index) {
		console.log("new item added");
	},
	onItemRemoved: function(id, folder, index) {
		console.log("item removed");
	},
	onItemChanged: function(id, property, isAnnotationProperty, value) {
		console.log("item changed");
		
	// isAnnotationProperty is a boolean value that is true of the changed property is an annotation.
	// You can access a bookmark item's annotations with the <code>nsIAnnotationService</code>.
	},
	onItemVisited: function(id, visitID, time) {
		console.log("item visited");
	// The visit id can be used with the History service to access other properties of the visit.
	// The time is the time at which the visit occurred, in microseconds.
	},
	onItemMoved: function(id, oldParent, oldIndex, newParent, newIndex) {
		console.log("item moved");
	// oldParent and newParent are the ids of the old and new parent folders of the moved item.
	},
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsINavBookmarkObserver) ||
			iid.equals(Ci.nsISupports)) {
		return this;
	}
	throw Cr.NS_ERROR_NO_INTERFACE;
	}
};

// Register the observer with the bookmarks service
var bmsvc = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Ci.nsINavBookmarksService);
bmsvc.addObserver(observer, false);


// **********************************************************************************


// **********************************************************************************
// *	Page Mode for mouse gestures

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

		// *	Add worker to workers array
		workers.push(worker);

		// *	Show Bookmarks UI panel
		worker.port.on("show", function (){ 
			panel.show();
		});

		// *	Distroy worker when tab is closed
		worker.on('detach', function () {
		  detachWorker(this, workers);
		});
	}
});
// **********************************************************************************





// **********************************************************************************
// *	Home page => settings
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
		worker.port.emit("currentPref", ss.Pref );
	}
});


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
// **********************************************************************************





// **********************************************************************************
// *	Persistent Storage - Save Preferences And Restore

var Preferences = {
	standard : {
		mark:	170,
		number:	2,
		height:	400,
		combo:	['Q', 1, 0, 0],
		mouse:	[0, 1, 1],
		version: 1.4,
		image:	'default',
	},
	
	start : function () {
		if (ss.Pref == null || ss.Pref == undefined || ss.Pref.version != this.standard.version) {
			this.set(this.standard);
			ss.Pref = this.standard;
		}
		else {
			this.set(ss.Pref);
		}
	},
 
	set	: function (Pref) {
		// this.log(Pref);
		panel.width = Pref.mark * Pref.number;
		panel.height = parseInt(Pref.height);
		this.createHotkey(this.getCombo( Pref.combo));
		panel.port.emit ("newPref", Pref);
	},

	// *	HotKey for Panel call
	getCombo : function (vector) {
		var combo = vector[0];
		if (vector[1]) combo += '-accel';
		if (vector[2]) combo += '-alt';
		if (vector[3]) combo += '-shift';
		return combo;
	},
	
	// *	Construct the key combination
	createHotkey : function (string) {
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

// **********************************************************************************




// **********************************************************************************
// *	Start Addon - Bookmarks UI


// *	Load Bookmarks => first layer (Toolbar) 
BookmarksUI.initHistroyServ();
BookmarksUI.setQueryFolder(3);
BookmarksUI.getMarksFrom();


// *	Start Preference module 
Preferences.start();



