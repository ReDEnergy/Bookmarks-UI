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
var {Cc, Ci, Cr} = require("chrome"); 	// Cc, Ci, Cm, Cr, Cu, components
const {Hotkey} = require("hotkeys");


// **********************************************************************************
// *	Addon Panel for Bookmarks 
 
var panel = require("panel").Panel({
	contentURL: data.url("panel/panel.html"),
	contentScriptFile: data.url('panel/panel.js')
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
	HistoryServ   : Cc["@mozilla.org/browser/nav-history-service;1"]
					.getService(Ci.nsINavHistoryService),
	LiveMarkServ  : Cc["@mozilla.org/browser/livemark-service;2"]
					.getService(Ci.nsILivemarkService),


	// *	Important variables
	ResNode 	: Ci.nsINavHistoryResultNode,
	ContResNode	: Ci.nsINavHistoryContainerResultNode,
				
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
	},


	// **********************************************************************************
	// *	Bookmarks Observer
	Observer : {
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
// **********************************************************************************
// *	Page Mode

(function () {
		
	require("page-mod").PageMod({
	
		include: ["*", "about:*", "file://*", "resource:*"],
	
		contentScriptFile:[data.url("gestures.js")],
	
		contentScriptWhen: "ready",
	
		onAttach: function (worker) {
			// *	Show Bookmarks UI panel
			worker.port.on("show", function (){ 
				panel.show();
			});
		}
	});

	var homepage_open = false;
	
	require("page-mod").PageMod({		 

		include: data.url("home/home.html"),
	
		contentScriptFile: [data.url("jquery-1.7.1.min.js"),
							data.url("home/worker.js")],
	
		contentScriptWhen: "end",
	
		onAttach: function onAttach(worker) {
			
			homepage_open = true;
			
			worker.port.on ("apply", function (Pref){
				ss.Pref = Pref;
				BookmarksUI.Preferences.set(Pref)
			});
		
			// *	Get current settings
			worker.port.emit("currentPref", ss.Pref );
		}
	});


	//	*	Open Homepage
	panel.port.on ("open_homepage", function () {
	
		// *	Open the homepage 
		if (homepage_open == false) {
			tabs.open ( data.url("home/home.html") );
			homepage_open = true;
			return;
		}
	
		// *	Swith to the homepage if it is already opened
		
		for (var i in tabs) {
			if ( tabs[i].url == data.url("home/home.html")) {
				tabs[i].activate();
				is_open = 1
			}
		}
	
		panel.hide();
	});
	
})();


// **********************************************************************************
// *	Persistent Storage - Save Preferences And Restore

BookmarksUI.Preferences = {
	
	hotkeys : null,
	
	Config : {
		mark:	170,
		number:	2,
		height:	400,
		combo:	['Q', 1, 0, 0],
		mouse:	[0, 1, 1],
		version: 1.5,
		image:	'default',
	},
	
	update : function () {
		// Set new configuration settings 
		// *	If add-on version differs from the config version
		// *	If configuration file doesn't exist 
		if ( !ss.Pref  || ss.Pref.version != this.Config.version) {
			this.set(this.Config);
			ss.Pref = this.Config;
			return;
		}
		// Retrieve and set configuration from file
		this.set(ss.Pref);
	},
 
	set	: function (Pref) {
		// this.log(Pref);
		panel.width = Pref.mark * Pref.number;
		panel.height = parseInt(Pref.height);
		panel.port.emit ("newPref", Pref);
		this.createHotkey(this.newCombo(Pref.combo));
	},

	// *	HotKey for Panel call
	newCombo : function (vector) {
		var combo = vector[0];
		if (vector[1]) combo += '-accel';
		if (vector[2]) combo += '-alt';
		if (vector[3]) combo += '-shift';
		return combo;
	},
	
	// *	Construct the key combination
	createHotkey : function (string) {
		if (this.hotkeys)	
			this.hotkeys.destroy();
		
		this.hotkeys = Hotkey({
			combo: string,
			onPress: this.hotkeyPress
		});
	},
	
	hotkeyPress : function () {
		if(panel.isShowing)
			panel.hide();
		else
			panel.show();
	},
	
	log : function (conf) {
		console.log ("conf Start")
		console.log ("Mark: "   + conf.mark);
		console.log ("Number: " + conf.number);
		console.log ("Height: " + conf.height);
		console.log ("Combo: "  + conf.combo);
		console.log ("Mouse: "  + conf.mouse);
		console.log ("Version: "+ conf.version);
		console.log ("Image: "  + conf.image);
		console.log ("conf End");
	}
}

// **********************************************************************************



// **********************************************************************************
// *	Load Addon

exports.main = function (options, callbacks) {
	console.log(options.loadReason);

	// Register the Observer with the Bookmarks service
	BookmarksUI.BookmarksServ.addObserver(BookmarksUI.Observer, false);

	// *	Load Bookmarks => first layer (Toolbar) 
	BookmarksUI.initHistroyServ();
	BookmarksUI.setQueryFolder(BookmarksUI.BookmarksServ.toolbarFolder);
	BookmarksUI.getMarksFrom();
	
	// *	Start Preference module 
	BookmarksUI.Preferences.update();

};


// **********************************************************************************
// *	Unload Addon

exports.onUnload = function (reason) {
	console.log (reason);

	// Remove the Bookrmarks Observer
	BookmarksUI.BookmarksServ.removeObserver(BookmarksUI.Observer);

};

