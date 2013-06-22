'use strict';

// *	Bookmarks rows

var Bookmark = {
	root	:	document.getElementById('marks'),
	navpath	:	document.getElementById('nav').children[0], 
	navback	:	document.getElementById('nav').children[1], 
	navloc	:	['Bookmarks Toolbar'],
	fav		:	{
		0	:	'fav_uri',
		5	:	'fav_query',
		6	:	'fav_folder',
		9	:	'fav_query',
	}
};

// *****************************************************************************

function Element(Mark, position) {
	var box		= document.createElement('div');
	var fav		= document.createElement('div');
	var title	= document.createElement('div');
	var text	= document.createTextNode(Mark.title);

	fav.className = Bookmark.fav[Mark.type];

	if (Mark.type === 0 && Mark.fav)
		fav.style.backgroundImage = 'url(' + Mark.fav + ')';

	box.className = 'box';
	box.setAttribute('id', Mark.id);
	box.setAttribute('type', Mark.type);

	title.className = 'title';
	title.textContent = Mark.title;
	
	box.appendChild(fav);
	box.appendChild(title);
	
	return box;
}

/**
 **	Navigation buttons - GUI
 **/

document.addEventListener('click' , function (e) {
	var target = e.target;
	
	// *	Open Addon Settings Page
	
	if (target.className == 'settings') { 
		self.port.emit ("open_addon_page");
		return;
	}

	if (target.className == 'path') {
		if(e.button > 0)
			self.port.emit("openAll");
		return;	
	}

	if (target.className == 'back') {

		if (Bookmark.navloc.length > 1) {
			Bookmark.navloc.pop();
			Bookmark.navpath.textContent = Bookmark.navloc[Bookmark.navloc.length-1];
			self.port.emit("goBack");
		}
		
		if (Bookmark.navloc.length == 1)
			Bookmark.navback.removeAttribute('style');
		
		return;
	}

	if (target.parentNode.className == 'box')
		target = target.parentNode;

	if (target.className == 'box') {
		
		var type = target.hasAttribute('type') ? target.getAttribute('type') : null;
		var id = target.hasAttribute('id') ? target.getAttribute('id') : null;
		
		if ((type | 0) === 0) {
			self.port.emit("openURI", id, e.button);
		}

		else {
			self.port.emit("getMarksFrom", id);
			var title = target.children[1].textContent;
			Bookmark.navloc.push(title);
			Bookmark.navpath.textContent = title;
			Bookmark.navback.style.display = 'block';
		}

		return;
	}
	
});


var Events = {
	folderClick : function (target) {
		self.port.emit("getMarksFrom", target.getAttribute('id'));
		var title = target.children[1].textContent;
		Bookmark.navloc.push(title);
		Bookmark.navpath.textContent = title;
		Bookmark.navback.style.display = 'block';
	},

	openURI : function (target) {
		self.port.emit("openURI", target.getAttribute('id'), e.button);
	}

}


// *****************************************************************************
// *	Addon Communication	

self.port.on("loadMarks", function (marks) {
	Bookmark.root.textContent = ''; 
	for (var i in marks) {
		var elem = Element(marks[i], i);
		Bookmark.root.appendChild(elem);	
	}
});

self.port.on("panel height", function(value) {
	Bookmark.root.style.height = value - 80 + 'px';	
});

self.port.on("panel image", function(img) {
	if (img === "default")
		document.body.removeAttribute('style');
	else
		document.body.style.background = 'url('+img+') center no-repeat';
});
