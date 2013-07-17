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
	box.setAttribute("draggable", "true");

	title.className = 'title';
	title.textContent = Mark.title;

	box.appendChild(fav);
	box.appendChild(title);

	if (Mark.position !== -1) {
		box.addEventListener('dragstart', DragHandlers.start);
		box.addEventListener('dragend', DragHandlers.end);
		box.addEventListener('dragenter', DragHandlers.enter);
	}

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

var DragHandlers = (function DragHandlers() {

	var DragElement = null;
	var index = null;
	var initial_index = null;

	var img = new Image();
	img.src = '../images/icon16.png';

	function getChildIndex(node) {
	    var i = 0;
	    while (node = node.previousElementSibling)
	        i++;
	    return i;
	}

	var start = function start(e) {
		DragElement = this;
		DragElement.classList.add('drag');
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('drag', 'drag');
		e.dataTransfer.setDragImage(img, -10, -10);
		index = getChildIndex(DragElement);
		initial_index = index;
	}

	var end = function end(e) {
		DragElement.classList.remove('drag');
		Events.moveItem(initial_index, index);
	}

	var enter = function enter(e) {
		if (this === DragElement)
			return;

		var index_node = getChildIndex(this);

		if (index <= index_node)
			Bookmark.root.insertBefore(DragElement, this.nextElementSibling);
		else
			Bookmark.root.insertBefore(DragElement, this);

		index = index_node;
	}

	return {
		start: start,
		enter: enter,
		end: end
	}

})();

var Events = {
	folderClick : function folderClick(target) {
		self.port.emit("getMarksFrom", target.getAttribute('id'));
		var title = target.children[1].textContent;
		Bookmark.navloc.push(title);
		Bookmark.navpath.textContent = title;
		Bookmark.navback.style.display = 'block';
	},

	openURI : function openURI(target) {
		self.port.emit("openURI", target.getAttribute('id'), e.button);
	},

	moveItem : function moveItem(item_index, move_index) {
		self.port.emit("moveItem", item_index, move_index);
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
