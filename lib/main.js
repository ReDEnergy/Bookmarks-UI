/*
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Lesser Public License as published
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Lesser General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Title			Bookmarks UI
 * Programmer		Gabriel Ivanica
 * Email			gabriel.ivanica@gmail.com
 * Description		GUI for interacting with bookmarks
 */

'use strict';

/*
 * SDK Modules
 */

const {Cc, Ci, Cr} = require('chrome'); 	// Cc, Ci, Cm, Cr, Cu, components
const data = require('sdk/self').data;
const tabs = require('sdk/tabs');
const {Hotkey} = require('sdk/hotkeys');
const ss = require('sdk/simple-storage').storage;
const simple_pref = require('sdk/simple-prefs');

/*
 * Imported Modules
 */
const protocol = require('protocol/lib/index');
const PP = require('prettyprint');

// Hide AwesomeBar and Bookmarks Toolbar
// const addonpage = require('addon-page-custom');

// *****************************************************************************

const about_handler = protocol.about('bookmarks-ui', {
	onRequest: function(request, response) {
		response.uri = data.url('home/home.html');
	}
});

const panel = require('sdk/panel').Panel({
	contentURL: data.url('panel/panel.html'),
	contentScriptFile: data.url('panel/panel.js')
});

const toolbar_button = require('toolbarbutton').ToolbarButton({
	id: "bookmarks-ui",
	label: "Bookmarks UI",
	image: data.url("images/icon16.png"),
	panel: panel
});



// *****************************************************************************

require('labs/userstyles').load(data.url('labs/chrome-ui.css'));

var chrome_ui = require('labs/chrome-ui.js');

var xul_ui = chrome_ui.ChromeXUL({
	height: "400px",
	width: "500px"
});

var toggleXUL = Hotkey({
	combo: "accel-shift-q",
	onPress: function() {
		xul_ui.toggle();
	}
});


// *****************************************************************************

var homepage_open = false;

// *****************************************************************************
// Main Addon Object

var BookmarksUI = {

	// Interfaces
	BookmarksServ 	: Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
						.getService(Ci.nsINavBookmarksService),
	HistoryServ   	: Cc["@mozilla.org/browser/nav-history-service;1"]
						.getService(Ci.nsINavHistoryService),
	AnnotationService : Cc["@mozilla.org/browser/annotation-service;1"]
                        .getService(Ci.nsIAnnotationService),

	// Important variables
	ResNode 	: Ci.nsINavHistoryResultNode,
	ContResNode	: Ci.nsINavHistoryContainerResultNode,
	LIVEMARK_ANNOTATION : "livemark/feedURI",

	// Bookmarks storage
	Bookmarks	: [],
	parent		: [],
	uri			: [],

	// Query options and properties
	query			: null,
	queryOptions 	: null,
	folderNode		: null,
	custom			: false,
	VALID_TYPES		: [0, 5, 6, 9],

	// RESULT_TYPE_URI					0	nsINavHistoryResultNode
	// RESULT_TYPE_VISIT 				1	nsINavHistoryVisitResultNode
	// RESULT_TYPE_FULL_VISIT 			2	nsINavHistoryFullVisitResultNode
	// RESULT_TYPE_DYNAMIC_CONTAINER 	4	nsINavHistoryContainerResultNode
	// RESULT_TYPE_QUERY 				5	nsINavHistoryQueryResultNode
	// RESULT_TYPE_FOLDER 				6	nsINavHistoryQueryResultNode
	// RESULT_TYPE_SEPARATOR 			7	nsINavHistoryResultNode
	// RESULT_TYPE_FOLDER_SHORTCUT		9	nsINavHistoryQueryResultNode

	//////////////////////////////////////////////////////////////
	// Methods
	//////////////////////////////////////////////////////////////

	// HistoryService query initialization
	initHistroyServ : function initHistroyServ() {
		this.query = this.HistoryServ.getNewQuery();
		this.queryOptions = this.HistoryServ.getNewQueryOptions();
	},

	// Set the query container
	setQueryFolder : function setQueryFolder(folderID) {
		this.parent.push(folderID);
		var result;

		// Custom Query Bookmark
		if (this.BookmarksServ.getItemType(folderID) == this.BookmarksServ.TYPE_BOOKMARK) {

			this.custom = true;

			var queriesRef = {};
			var queryCountRef = {};
			var optionsRef = {};

			this.HistoryServ.queryStringToQueries(this.uri[folderID], queriesRef, queryCountRef, optionsRef);
			result = this.HistoryServ.executeQueries(queriesRef.value, queryCountRef.value, optionsRef.value);
		}

		// Standard Folder Query
		else {
			this.custom = false;
			this.query.setFolders([folderID], 1);
			result = this.HistoryServ.executeQuery(this.query, this.queryOptions);
		}

		this.folderNode = result.root;
		this.Bookmarks.length = 0;
	},

	// Update current state of view - Observer action
	updateView : function updateView() {

		var result = this.HistoryServ.executeQuery(this.query, this.queryOptions);
		this.folderNode = result.root;
		this.Bookmarks.length = 0;

		this.getMarksFrom();
	},


	// Get all marks from the query folder
	getMarksFrom : function getMarksFrom() {
		this.folderNode.containerOpen = true;

		var childCount = this.folderNode.childCount;

		for (var i=0; i < childCount; i++) {
			var childNode = this.folderNode.getChild(i);

			if (this.isValidBookmarkItem(childNode) === true)
				this.Bookmarks.push(new this.Mark(childNode, i));
		}

		this.folderNode.containerOpen = false;

		panel.port.emit("loadMarks", this.Bookmarks);
	},

	// Return true if ITEM must be added to VIEW
	isValidBookmarkItem: function isValidBookmarkItem(childNode) {

		if (this.VALID_TYPES.indexOf(childNode.type) === -1)
			return false;

		if (childNode.type === childNode.RESULT_TYPE_FOLDER)
			if(this.isLiveMarkFeed(childNode.itemId))
				return false;

		return true;
	},

	// Return if item is LiveMarkFeed
	isLiveMarkFeed: function isLiveMarkFeed(aItemId) {
		var value = false;
		try {
			value = this.AnnotationService.itemHasAnnotation(aItemId, this.LIVEMARK_ANNOTATION);
		}
		catch (NS_ERROR_ILLEGAL_VALUE) {
		}
		return value;
	},

	moveItem : function moveItem(item_index, move_index) {
		var parent = this.parent[this.parent.length - 1];

		var id = this.Bookmarks[item_index].id;
		var item_pos = this.Bookmarks[item_index].position;
		var move_pos = this.Bookmarks[move_index].position;

		if (item_pos < move_pos)
			move_pos++;

		this.BookmarksServ.moveItem(id, parent, move_pos);
	},

	// Object for storing bookmark info
	Mark : function Mark(childNode, index) {

		this.id			= childNode.itemId;
		this.position	= childNode.bookmarkIndex;
		this.type		= childNode.type;
		this.title		= childNode.title;
		this.fav		= childNode.icon.substring(17);

		// Skip if favicon is taken from xmarks.com
		if (childNode.icon.substring(24, 39) == 'icon.xmarks.com')
			this.fav = '';

		// If bookmarks has no title show the uri as title
		if (childNode.title == null)
			this.title = childNode.uri;

		// If custom query index is undefined -> add custom index from childNodes iteration
		if (BookmarksUI.custom == true)
			this.id = index;

		BookmarksUI.uri[this.id] = childNode.uri;

	},

	// Open all URIs from the current container
	openAllURIs : function openAllURIs() {
		for (var i in this.Bookmarks)
			if (this.Bookmarks[i].type == 0)
				tabs.open(this.uri[this.Bookmarks[i].id]);
	},


	// *************************************************************************
	// Bookmarks Observer
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


// *****************************************************************************
// What about some Prototyping

// Debug : log marks info
BookmarksUI.Mark.prototype.print = function () {
	var _prop = [];
	_prop.push (this.id, this.position, this.type, this.parent, this.title, this.fav);
	// console.log (_prop.join(' \t'));
}

// Debug : log all bookmarks info
BookmarksUI.Bookmarks.print = function () {
	for (var i=0; i<this.length; i++)
		this[i].print();
}

// *****************************************************************************
// Addon comunication

// Navigate back to the previous folder
panel.port.on ("goBack", function () {
	BookmarksUI.parent.pop();
	BookmarksUI.setQueryFolder(BookmarksUI.parent.pop());
	BookmarksUI.getMarksFrom();
});


// Load bookmarks from folder
panel.port.on ("getMarksFrom", function (folderID) {
	BookmarksUI.setQueryFolder(folderID);
	BookmarksUI.getMarksFrom();
});

// Open a Link
panel.port.on ("openURI", function (id , button) {
	var method = ss.Pref.mouse[button];

	if (method === 2)
		return;

	if (method === 1) {
		tabs.activeTab.url = BookmarksUI.uri[id];
		return;
	}

	if (method === 0)
		tabs.open(BookmarksUI.uri[id]);

});

// Open all links from the same folder
panel.port.on ("openAll", function() {
	BookmarksUI.openAllURIs();
});


// Open a Link
panel.port.on ("moveItem", function (item_index , move_index) {
	BookmarksUI.moveItem(item_index, move_index);
});

//	*	Open Homepage
panel.port.on ("open_addon_page", function() {
	BookmarksUI.Preferences.openAddonPage();
});


// *****************************************************************************
// *****************************************************************************
// Page Mode

(function () {

	require("sdk/page-mod").PageMod({

		include: 'about:bookmarks-ui',

		contentScriptFile: data.url("home/home.js"),

		contentScriptWhen: "end",

		attachTo: ["existing", "top"],

		onAttach: function onAttach(worker) {

			homepage_open = true;

			worker.on('detach', function () {
				homepage_open = false;
			});

			// Get current settings
			worker.port.emit("loadAddonSettings", ss.Pref );

			worker.port.on ("apply", function (option, value) {
				coonsole.log(option + " : " + value);
			});

			worker.port.on ("hotkey switch", function () {
				BookmarksUI.Preferences.switchHotKey();
				worker.port.emit("hotkey state", ss.Pref.hotkey);
			});

			worker.port.on ("specialkey switch", function (key) {
				if (BookmarksUI.Preferences.updateSpecialKeys(key) == 1)
					worker.port.emit("specialkey state", key);
			});

			worker.port.on("hotkey KEY", function (key) {
				key = BookmarksUI.Preferences.updateHotKeyKEY(key);
				worker.port.emit("hotkey KEY", key);
			});

			worker.port.on("hotkey reset", function() {
				var combo = BookmarksUI.Preferences.resetHotKey();
				worker.port.emit("hotkey reset", combo);
			});

			worker.port.on("mouse button", function(obj) {
				obj.value = BookmarksUI.Preferences.updateMouseAction(obj);
				worker.port.emit("mouse button", obj);
			});

			worker.port.on("mouse reset", function() {
				var mouse = BookmarksUI.Preferences.resetMouseActions();
				worker.port.emit("mouse reset", mouse);
			});

			worker.port.on("panel height", function(value) {
				var value = BookmarksUI.Preferences.updatePanelHeight(value);
				worker.port.emit("panel height", value);
			});

			worker.port.on("panel columns", function(value) {
				var value = BookmarksUI.Preferences.updatePannelColumns(value);
				worker.port.emit("panel columns", value);
			});

			worker.port.on("panel reset", function() {
				var obj = BookmarksUI.Preferences.panelReset();
				worker.port.emit("panel reset", obj);
			});

			worker.port.on("panel image", function(image) {
				ss.Pref.image = image;
				panel.port.emit("panel image", ss.Pref.image);
			});

			worker.port.on("panel image reset", function(image) {
				ss.Pref.image = 'default';
				panel.port.emit("panel image", ss.Pref.image);
			});

			// PP.log(ss.Pref);
		}
	});

})();


// *****************************************************************************
// Preferences

BookmarksUI.Preferences = {

	hotkeys : null,

	Config : function () {
		this.mark = 170;
		this.columns = 2;
		this.height = 400;
		this.hotkey = 1;
		this.combo = ['Q', 1, 0, 0];
		this.mouse = [0, 1, 1];
		this.version = '1.6.2';
		this.image = 'default';
	},

	openAddonPage : function () {

		panel.hide();

		// Open the homepage
		if (homepage_open == false) {
			tabs.open ('about:bookmarks-ui');
			homepage_open = true;
			return;
		}

		// Swith to the homepage if it is already opened
		for (var i in tabs) {
			if ( tabs[i].url == 'about:bookmarks-ui') {
				tabs[i].activate();
				homepage_open = true;
			}
		}
	},

	update : function () {

		var Default = new this.Config();

		// Set new configuration settings
		// If add-on version differs from the configuration
		// If configuration file doesn't exist


		if ( !ss.Pref  || ss.Pref.version != Default.version) {
			ss.Pref = Default;
		}

		this.updatePanel();

		if (ss.Pref.hotkey == 1)
			this.createHotkey(this.newCombo(ss.Pref.combo));

		panel.port.emit("panel image", ss.Pref.image);

	},

	// HotKey for Panel call
	newCombo : function (vector) {
		var combo = vector[0];
		if (vector[1]) combo += '-accel';
		if (vector[2]) combo += '-alt';
		if (vector[3]) combo += '-shift';
		return combo;
	},

	// Construct the key combination
	createHotkey : function (string) {

		ss.Pref.hotkey = 1;

		this.hotkeys = Hotkey({
			combo: string,
			onPress: this.hotkeyPress
		});
	},

	destroyHotKey : function (disable) {
		if (ss.Pref.hotkey == 0)
			return;

		if (disable)
			ss.Pref.hotkey = 0;

		this.hotkeys.destroy();
	},

	switchHotKey : function () {
		if (ss.Pref.hotkey == 1)
			this.destroyHotKey(1);
		else
			this.createHotkey(this.newCombo(ss.Pref.combo));
	},

	updateHotkey : function () {
		this.destroyHotKey(0);
		this.createHotkey(this.newCombo(ss.Pref.combo));
	},

	hotkeyPress : function () {
		if(panel.isShowing)
			panel.hide();
		else
			panel.show();
	},

	updateSpecialKeys : function (key) {

		var aux = ss.Pref.combo;
		var sum = aux[1] + aux[2] + aux[3] - aux[key] + 1 - aux[key];

		if (sum == 0 || sum == 1 && aux[3] == 1 && key!=3) {
			return 0;
		}
		else {
			ss.Pref.combo[key] = 1 - ss.Pref.combo[key];
			this.updateHotkey();
			return 1;
		}
	},

	updateHotKeyKEY : function (key) {
		if (key >= 'A' && key <= 'Z') {
			ss.Pref.combo[0] = key
			this.updateHotkey();
		}
		return ss.Pref.combo[0];
	},

	resetHotKey : function () {
		ss.Pref.combo = new this.Config().combo;
		this.updateHotkey();
		return ss.Pref.combo;
	},

	updateMouseAction : function (obj) {
		ss.Pref.mouse[obj.button] = obj.value;
		return ss.Pref.mouse[obj.button];
	},

	resetMouseActions : function () {
		ss.Pref.mouse = new this.Config().mouse;
		return ss.Pref.mouse;
	},

	updatePanelHeight : function (value) {
		ss.Pref.height = value;
		panel.height = parseInt(value);
		panel.port.emit("panel height", panel.height);
		return panel.height;
	},

	updatePannelColumns : function (value) {
		ss.Pref.columns = value;
		panel.width = ss.Pref.mark * value;
		return ss.Pref.columns;
	},

	updatePanel : function () {
		panel.width = ss.Pref.mark * ss.Pref.columns;
		panel.height = parseInt(ss.Pref.height);

		panel.port.emit("panel height", panel.height);
	},

	panelReset : function () {
		var X = new this.Config();
		ss.Pref.height = X.height;
		ss.Pref.columns = X.columns;

		this.updatePanel();

		return { height: panel.height, columns : ss.Pref.columns};
	}

}

// *****************************************************************************


// *****************************************************************************
// Load Addon

exports.main = function (options, callbacks) {

	// console.log(options.loadReason);
	var reasons = ["install", "enable", "upgrade"];

	// Register the Observer with the Bookmarks service
	BookmarksUI.BookmarksServ.addObserver(BookmarksUI.Observer, false);

	// Load Bookmarks => first layer (Toolbar)
	BookmarksUI.initHistroyServ();
	BookmarksUI.setQueryFolder(BookmarksUI.BookmarksServ.toolbarFolder);
	BookmarksUI.getMarksFrom();

	// Start Preference module
	BookmarksUI.Preferences.update();
	about_handler.register();

	// Add additional button to open the add-on home page
	simple_pref.on("open_addon_page", BookmarksUI.Preferences.openAddonPage);

	if (reasons.indexOf(require('self').loadReason) !== -1) {
		toolbar_button.moveTo({
		    toolbarID: "nav-bar",
		    forceMove: true
		});
	}

};


// *****************************************************************************
// Unload Addon

exports.onUnload = function (reason) {
	// console.log (reason);

	// Remove the Bookrmarks Observer
	BookmarksUI.BookmarksServ.removeObserver(BookmarksUI.Observer);
	BookmarksUI.Preferences.destroyHotKey(0);
	about_handler.unregister()
	toolbar_button.destroy();
	simple_pref.removeListener("open_addon_page", BookmarksUI.Preferences.openAddonPage);

};

