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
var {Cc, Ci, Cm, Cr, Cu, components} = require("chrome");
const {Hotkey} = require("hotkeys");

/*	
 * Global Variables
 */

var panel;
var panel_hotkey;
var workers = [];


// **********************************************************************************
// *	Addon Panel for Bookmarks 
 
var panel = require("panel").Panel({
	contentURL: data.url("panel/panel.html"),
	contentScriptFile: [data.url('panel/panel.js'),
						data.url('panel/drag.js')]
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
	BookmarksServ : Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
					.getService(Ci.nsINavBookmarksService),
	HistoryServ	  : Cc["@mozilla.org/browser/nav-history-service;1"]
					.getService(Ci.nsINavHistoryService),
	LiveMarkServ  : Cc["@mozilla.org/browser/livemark-service;2"]
					.getService(Ci.nsILivemarkService),					
					

	// *	Important variables
	ResNode 	: Ci.nsINavHistoryResultNode,
	ContResNode : Ci.nsINavHistoryContainerResultNode,
				
	// *	Bookmarks storage			
	Bookmarks	: [],
	parent		: [],
	uri			: [],
	 
	// *	Query options and properties
	query			: null,
	queryOptions 	: null,
	folderNode		: null,
	custom			: false,
	type_allowed	: [0, 5, 6, 9],

	// RESULT_TYPE_URI					0	nsINavHistoryResultNode.
	// RESULT_TYPE_VISIT 				1	nsINavHistoryVisitResultNode.
	// RESULT_TYPE_FULL_VISIT 			2	nsINavHistoryFullVisitResultNode.
	// RESULT_TYPE_DYNAMIC_CONTAINER 	4	nsINavHistoryContainerResultNode.
	// RESULT_TYPE_QUERY 				5	nsINavHistoryQueryResultNode.
	// RESULT_TYPE_FOLDER 				6	nsINavHistoryQueryResultNode.
	// RESULT_TYPE_SEPARATOR 			7	nsINavHistoryResultNode.
	// RESULT_TYPE_FOLDER_SHORTCUT		9	nsINavHistoryQueryResultNode.


	//////////////////////////////////////////////////////////////
	// *	Methods
	//////////////////////////////////////////////////////////////

	// *	HistoryService query initialization 
	initHistroyServ : function ( ) {
		this.query = this.HistoryServ.getNewQuery();
		this.queryOptions = this.HistoryServ.getNewQueryOptions();
	},
	
	// *	Set the query container
	setQueryFolder : function (folderID) {
		
		this.parent.push(folderID);

		var result;
		
		// *	Custom Query
		if (this.BookmarksServ.getItemType(folderID) == this.BookmarksServ.TYPE_BOOKMARK) {			

			this.custom = true;

			var queriesRef = {};
			var queryCountRef = {};
			var optionsRef = {};

			this.HistoryServ.queryStringToQueries(this.uri[folderID], queriesRef, queryCountRef, optionsRef);
			result = this.HistoryServ.executeQueries(queriesRef.value, queryCountRef.value, optionsRef.value);
		}
		
		// *	Standard Folder Query
		else {
			this.custom = false;
			
			this.query.setFolders([folderID], 1);
			result = this.HistoryServ.executeQuery(this.query, this.queryOptions);
		}
		
		this.folderNode = result.root;
		this.Bookmarks.length = 0;

	},	
	
	// *	Update current state of view - Observer action
	updateView : function () {

		var result = this.HistoryServ.executeQuery(this.query, this.queryOptions);
		this.folderNode = result.root;
		this.Bookmarks.length = 0;

		this.getMarksFrom();
	},

	
	// *	Get all marks from the query folder
	getMarksFrom : function () {
		this.folderNode.containerOpen = true;
		
		var childCount = this.folderNode.childCount;
		
		for (var i=0; i < childCount; i++) {
			var childNode = this.folderNode.getChild(i);
			
			// *	Skip Livemarks Folders
			if (childNode.type == 6 && this.LiveMarkServ.isLivemark(childNode.itemId) == true)
				continue;

			if (this.type_allowed.indexOf(childNode.type) != -1) {
				this.Bookmarks.push(new this.Mark(childNode, i));
			}		
		}
		
		this.folderNode.containerOpen = false;
		panel.port.emit("loadMarks", this.Bookmarks);
	},
	
	
	// *	Object for storing bookmark info
	Mark : function (childNode, index) {

		
		this.id			= childNode.itemId;
		this.position	= childNode.bookmarkIndex;
		this.type		= childNode.type;
		this.title		= childNode.title;
		this.fav		= childNode.icon.substring(17);

		// *	Skip if favicon is taken from xmarks.com		
		if (childNode.icon.substring(24, 39) == 'icon.xmarks.com')
			this.fav = '';
		
		// *	If bookmarks has no title show the uri as title
		if (childNode.title == null)
			this.title = childNode.uri;

		// *	If custom query index is undefined -> add custom index from childNodes iteration 
		if (BookmarksUI.custom == true)
			this.id = index;

		BookmarksUI.uri[this.id] = childNode.uri;
		
	},
	
	// *	Open all URIs from the current container
	openAllURIs : function() {
		for (var i in this.Bookmarks) 
			if (this.Bookmarks[i].type == 0)
				tabs.open(this.uri[this.Bookmarks[i].id]);
	}
 

}

// **********************************************************************************
// *	What about some Prototyping 

// *	Debug : log marks info
BookmarksUI.Mark.prototype.print = function () {
	var _prop = [];
	_prop.push (this.id, this.position, this.type, this.parent, this.title, this.fav);
	// console.log (_prop.join(' \t'));
}

// *	Debug : log all bookmarks info
BookmarksUI.Bookmarks.print = function () {
	for (var i=0; i<this.length; i++)
		this[i].print();
}

// **********************************************************************************
// *	Addon comunication

// *	Navigate back to the previous folder
panel.port.on ("goBack", function () {
	BookmarksUI.parent.pop();
	BookmarksUI.setQueryFolder(BookmarksUI.parent.pop());
	BookmarksUI.getMarksFrom();
});


// *	Load bookmarks from folder
panel.port.on ("getMarksFrom", function (folderID) {
	BookmarksUI.setQueryFolder(folderID);
	BookmarksUI.getMarksFrom();
});

// *	Open a Link 
panel.port.on ("openURI", function (id , button) {
	var method = ss.Pref.mouse[button];
	if (method == 0)
		tabs.activeTab.url = BookmarksUI.uri[id]; 
	if (method == 1)
		tabs.open(BookmarksUI.uri[id]); 
});

// *	Open all links from the same folder
panel.port.on ("openAll", function() {
	BookmarksUI.openAllURIs();
});


// **********************************************************************************
// *	Bookmarks Observer

var Observer = {
	in_batch : false,
	change_property : ['title', 'uri'],
	
	onBeginUpdateBatch: function() {
		// console.log("batch update start");
		this.in_batch = true;
	},
	
	onEndUpdateBatch: function() {
		// console.log("batch update end");
		this.in_batch = false;
		this.updateView(0);
	},
	
	onItemAdded: function(id, folder, index) {
		// console.log("Item Added");
		this.updateView(0);
	},
	
	onItemRemoved: function(id, folder, index) {
		// console.log("Item Removed");
		this.updateView(folder);
	},
	
	onItemChanged: function(id, property, isAnnotationProperty, value) {
		// isAnnotationProperty is a boolean value that is true of the changed property is an annotation.
		// You can access a bookmark item's annotations with the <code>nsIAnnotationService</code>.

		// console.log("Item Changed");

		if (this.change_property.indexOf(property) != -1)		
			this.updateView(0);
	},
	
	// onItemVisited: function(id, visitID, time) {
		// The visit id can be used with the History service to access other properties of the visit.
		// The time is the time at which the visit occurred, in microseconds.
	// },
	
	onItemMoved: function(id, oldParent, oldIndex, newParent, newIndex) {
		// console.log("Item Moved");
		this.updateView(newParent);
	},
	
	QueryInterface: function(iid) {
		if (iid.equals(Ci.nsINavBookmarkObserver) || iid.equals(Ci.nsISupports)) {
			return this;
		}
	
		throw Cr.NS_ERROR_NO_INTERFACE;
	},
	
	updateView : function (folder) {
		if (this.in_batch)
			return;
					
		if (folder == 0 || folder == BookmarksUI.parent[BookmarksUI.parent.length-1])
			BookmarksUI.updateView();
	}
};


// Register the observer with the Bookmarks service
BookmarksUI.BookmarksServ.addObserver(Observer, false);

// **********************************************************************************


// **********************************************************************************
// *	Page Mode for mouse gestures

// *	Delete workers when the tab is closed
function detachWorker(worker, workerArray) {
	var index = workerArray.indexOf(worker);
	if(index != -1)
		workerArray.splice(index, 1);
}

// *	Create worker for each new opened tab
var pageMod = require("page-mod").PageMod({
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
var HomePage = require("page-mod").PageMod({		 
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
	var open_state = 0;

	// *	Swith to the addon homepage if it is already opened
	for (var i in tabs) {
		if ( tabs[i].url == data.url("home/home.html")) {
			tabs[i].activate();
			open_state = 1
		}
	}

	// *	Open the homepage 
	if (open_state == 0)
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
		version: 1.5,
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
				else {
					panel.show();
				}
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
BookmarksUI.setQueryFolder(BookmarksUI.BookmarksServ.toolbarFolder);
BookmarksUI.getMarksFrom();


// *	Start Preference module 
Preferences.start();


