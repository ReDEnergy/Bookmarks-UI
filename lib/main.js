/******************************************************************
 *	Bookmark UI 
 *		by Ivanica Gabriel
 ******************************************************************/

 // *	Requires
var data = require("self").data;
var ss = require("simple-storage").storage;
var tabs = require("tabs");
var {Cc, Ci} = require("chrome");
var xpcom = require("xpcom");
const {Hotkey} = require("hotkeys");
var panel_hotkey = null;
 
 // *	Connect to the profile database places.sqlite
var dirService = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties);
var dbService = Cc["@mozilla.org/storage/service;1"].getService(Ci.mozIStorageService);
var dbFile = dirService.get("ProfD", Ci.nsIFile);
	dbFile.append("places.sqlite");
var dbConnection = dbService.openDatabase(dbFile);
 
// *	SQLite Panel
var panel = require("panel").Panel({
	contentURL: data.url("panel/panel.html"),
	contentScriptFile: [data.url("jquery-1.7.1.min.js"),
						data.url('panel/panel.js')],
});

/**************************************************************************************************************
 **************************************************************************************************************/ 


function bookmark (row) {
	this.id = row.getResultByName('id');
	this.type = row.getResultByName('type');
	this.parent = row.getResultByName('parent');
	this.position = row.getResultByName('position');
	this.title = row.getResultByName('title');
	this.url = row.getResultByName('url');
	this.fav = row.getResultByName('fav');
}

bookmark.prototype.log = function () {
	console.log (this.id + " " + this.type + " " + this.parent + " " + this.position + " " + this.title + " " + this.url + " " + this.fav);
}

/*
	SELECT id, type, parent, position, title, fk AS url, fk as fav 
			FROM moz_bookmarks AS B 
			WHERE parent=117  AND type>1 
	UNION 
	SELECT	B.id, type, parent, position, B.title, P.url, P.favicon_id as fav
			FROM moz_bookmarks AS B, moz_places as P
			WHERE parent=117 AND type=1 AND B.fk=P.id and P.favicon_id IS NULL
	UNION 
	SELECT	B.id, type, parent, position, B.title, P.url, F.url as fav 
			FROM moz_bookmarks AS B, moz_places as P, moz_favicons as F 
			WHERE parent=117 AND type=1 AND B.fk=P.id AND P.favicon_id=F.id
	ORDER BY position			
 */

function DbSelect () {
	this.col_1 = 'id, type, parent, position, title, fk AS url, fk as fav';
	this.col_2 = 'B.id, type, parent, position, B.title, P.url, P.favicon_id as fav';
	this.col_3 = 'B.id, type, parent, position, B.title, P.url, F.url as fav';
	this.table_1 = "moz_bookmarks AS B";
	this.table_2 = "moz_bookmarks AS B, moz_places as P";
	this.table_3 = "moz_bookmarks AS B, moz_places as P, moz_favicons as F";
	
	this.generate = function (parent) {
		this.query =" SELECT " +this.col_1+ " FROM " +this.table_1+ " WHERE parent= " +parent+ " AND type>1 " + 
					" UNION " + 
					" SELECT " +this.col_2+ " FROM " +this.table_2+ " WHERE parent= " +parent+ " AND type=1 AND B.fk=P.id AND P.favicon_id IS NULL" +
					" UNION " + 
					" SELECT " +this.col_3+ " FROM " +this.table_3+ " WHERE parent= " +parent+ " AND type=1 AND B.fk=P.id AND P.favicon_id=F.id" +
					" ORDER BY position";
	}

	this.execute = function (B) {
		B.length = 0;
		statement = dbConnection.createAsyncStatement(this.query);
		statement.executeAsync({  
			handleResult: function(aResultSet) {  
				for (let row = aResultSet.getNextRow();	row; row = aResultSet.getNextRow()) {
					B.push(new bookmark(row));
				}
			},
			  
			handleError: function(aError) {  
				print("Error: " + aError.message);  
			},  

			handleCompletion: function(aReason) {
				panel.port.emit("generate", B);
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
					print("Query canceled or aborted!");  
			}  
		});  
	}
}

/**
 **	Generating the UI and mouse commands
 **/


var Marks = new Array(); 
var query = new DbSelect();
	query.generate(3);
	query.execute(Marks);

panel.port.on ("GetNew", function (parent) {
	query.generate(parent);
	query.execute(Marks);
});

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

// *	Navigate back to the previous folder
panel.port.on ("GoBack", function (parent) {
	query.generate(parent);
	query.execute(Marks);
});

// **********************************************************************************
// *	Page Mode for mouse gestures

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
	default : {
		mark:	170,
		number:	2,
		width:	340,
		height:	400,
		combo:	['Q', 1, 0, 0],
		image:	0,
		mouse:	[0, 1, 1],
	},
	
	start : function () {
		if (ss.Pref)
			this.set(ss.Pref);
		else
			this.set(this.default);
	},
 
	set	: function (Pref) {
		this.log(Pref);
		panel.width = Pref.width;
		panel.height = Pref.height;
		create_hotkey(getcombo( Pref.combo));
		panel.port.emit ("NewPref", Pref);
	},
	
	log : function (Pref) {
		console.log ("Pref Start")
		console.log ("Width: " + Pref.width);
		console.log ("Number: " + Pref.number);
		console.log ("Combo: " + Pref.combo);
		console.log ("Mouse: " + Pref.mouse);
		if (Pref.image)
			console.log ("Image: " + Pref.image.length);
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
