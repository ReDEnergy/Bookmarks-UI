window.onload = function () {
	enableDragging();
}

var GUI;
var PH;

function enableDragging() {

	GUI = document.getElementById("gui");
	PH = new Placeholder();

	for (var i=0; i<30; i++)
		GUI.appendChild(new Box(i));


	for (var i=0; i<GUI.childElementCount; i++) {
		var box = GUI.children[i];

		box.setAttribute("draggable", "true");

		box.addEventListener('dragstart', DragHandlers.start, false);
		box.addEventListener('dragend'  , DragHandlers.end  , false);

		box.addEventListener('dragenter', DragHandlers.enter, false);
		box.addEventListener('dragover' , DragHandlers.over , false);
		box.addEventListener('dragleave', DragHandlers.leave, false);

		box.addEventListener('drop'     , DragHandlers.drop , false);
	};

};

function Box (id) {
	var box = document.createElement('div');
	var bookmark = document.createElement('div');
	var favicon = document.createElement('div');
	var title = document.createElement('div');

	box.className = 'box';
	box.setAttribute("id", "box"+id);
	box.setAttribute("draggable", "true");
	box.setAttribute('ready', 'true');

	bookmark.className = 'text';
	favicon.className = 'fav';
	title.textContent = "Awesome Box " + id;

	bookmark.appendChild(favicon);
	bookmark.appendChild(title);
	box.appendChild(bookmark);

	return box;
}


function Placeholder () {
	var box = document.createElement('div');
	var bookmark = document.createElement('div');
	var favicon = document.createElement('div');
	var title = document.createElement('div');

	box.className = 'box';
	box.setAttribute("id", "placeholder");
	bookmark.className = 'text';
	box.appendChild(bookmark);

	return box;
}


function getChildIndex(node)
{
    var i = 1;
    while (node = node.previousElementSibling)
        ++i;
    return i;
}



var DragElement;

var DragHandlers = {
	start : function(e) {
		// 	this = start node
		// console.log('start');
		DragElement = this;
		DragElement.style.boxShadow = '0px 0px 3px 2px #1D9CE0, inset 0px 0px 3px 0px #67E073';
		// DragElement.style.display = 'none';
		e.dataTransfer.effectAllowed = 'copy';
		e.dataTransfer.setData('drag', 'drag');
		// var x = new Image();
		// x.src = '../images/fav3.png';
		// e.dataTransfer.setDragImage(x, -10, -10);
	},

	end : function(e) {
		// 	this = destination node
		// console.log('end');
		DragElement.removeAttribute('style');
		// DragElement.style.removeProperty('display');
		// GUI.insertBefore(DragElement, PH);
		// GUI.removeChild(PH);
	},

	enter : function(e) {
		if (this === DragElement)
			return;

		// this = destination node
		var index_node = getChildIndex(this);
		var index_ph = getChildIndex(DragElement);

		if (index_ph <= index_node)
			GUI.insertBefore(DragElement, this.nextElementSibling);
		else
			GUI.insertBefore(DragElement, this);
	},

	over : function(e) {
		// 	this = destination node
		e.preventDefault();
	},

	leave : function(e) {
		// 	this = destination node
		// console.log('leave');
	},

	drag : function(e) {
		// 	this = start node
	},

	drop : function(e) {
		// console.log('drop');
		// 	this = mouse relese (drop) on the "element"
	}
}

