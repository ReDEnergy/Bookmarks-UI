/******************************************************************
 *	Bookmark UI 
 *		by Ivanica Gabriel
 ******************************************************************/

 // *	Requires
var data = require("self").data;
var ss = require("simple-storage").storage;
var tabs = require("tabs");
var {Cc, Ci} = require("chrome");
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
	
	this.log = function () {
		console.log (this.id + " " + this.type + " " + this.parent + " " + this.position + " " + this.title + " " + this.url + " " + this.fav);
	}
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

	this.execute = function () {
		B = new Array();
		statement = dbConnection.createAsyncStatement(this.query);
		statement.executeAsync({  
			handleResult: function(aResultSet) {  
				for (let row = aResultSet.getNextRow();	row; row = aResultSet.getNextRow()) {
					var mark = new bookmark(row);
					B.push(mark);
				}
			},
			  
			handleError: function(aError) {  
				print("Error: " + aError.message);  
			},  

			handleCompletion: function(aReason) {
				panel.port.emit("Gen2", B);
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
					print("Query canceled or aborted!");  
			}  
		});  
	}
}
 
var query = new DbSelect();
query.generate(3);
query.execute();

panel.port.on ("GetNew", function (parent) {
	query.generate(parent);
	query.execute();
});

panel.port.on ("OpenThis", function (url) {
	tabs.open(url);
});

panel.port.on ("GoBack", function (parent) {
	query.generate(parent);
	query.execute();
});

// **********************************************************************************
// *	Page Mode

var workers = [];
 
function detachWorker(worker, workerArray) {
  var index = workerArray.indexOf(worker);
  if(index != -1) {
    workerArray.splice(index, 1);
  }
}

var pageMod = require("page-mod");
pageMod.PageMod({
	include: ["*", "about:*", "file://*", "resource:*"],
	contentScriptFile: [data.url("gestures.js")	/*, data.url("jquery-1.7.1.min.js") */],
	contentScriptWhen: "ready",
	onAttach: function onAttach(worker) {
		worker.port.on("show", function (){ 
			panel.show();
		});
		worker.on('detach', function () {
		});
	}
});

// **********************************************************************************
// *	HotKey for show/hide Panel

function getcombo(string, callback) {
	if (string) {
		var combo=string[0];
		if (string[1] == '1') combo = combo + '-accel';
		if (string[2] == '1') combo = combo + '-alt';
		if (string[3] == '1') combo = combo + '-shift';
		callback(combo);
	}
}

function create_hotkey (string) {
	if (panel_hotkey)	panel_hotkey.destroy();
	
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
		worker.port.on ("apply", function (save){
			ss.save = save;
			set_settings (save);
		});
		// *	Get current settings
		worker.port.emit ("current_settings", ss.save );
	}
});

// **********************************************************************************
// *	Persistent Storage - Save Settings and restore

if (ss.save) 
	set_settings ( ss.save);
else {
	var save = {
		width : 300,
		height : 400,
		combo : 'Q100',
		image : null,
	}
	ss.save = save;
	set_settings(save);
}

// **********************************************************************************
// *	Set settings

function set_settings (save) {
	// *	Set dimensions
	panel.width = save.width;
	panel.height = save.height;
	// *	Set new hotkeys
	var combo;
	getcombo(save.combo, function (x) {
		combo = x;
	});
	if (combo)	create_hotkey(combo);
	// *	Set image if exist
	panel.port.emit ("new_settings", save);
}

function log_settings (save) {
	console.log ("Saved settings :")
	console.log ("Width: " + save.width);
	console.log ("Height: " + save.height);
	console.log ("Combo: " + save.combo);
	if (save.image) 
		console.log ("Image: " + save.image.length);
	console.log ("End ... ")
}

// **********************************************************************************
//	*	Open Homepage
panel.port.on ("open_homepage", function () {	
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
