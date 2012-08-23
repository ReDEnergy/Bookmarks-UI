var Container = null;

window.onload = function () {
	document.getElementById("config").children[1].addEventListener('click', enableDragging);
}; 


function enableDragging() {

	Container = document.getElementById("f3");

	for (var i=0; i<Container.childElementCount; i++) {
		var box = Container.children[i];

		box.setAttribute("draggable", "true");
		
		box.addEventListener('dragstart', DragHandlers.start, false);
		box.addEventListener('dragend'  , DragHandlers.end  , false);

		box.addEventListener('dragenter', DragHandlers.enter, false);
		box.addEventListener('dragover' , DragHandlers.over , false);
		box.addEventListener('dragleave', DragHandlers.leave, false);

		// box.addEventListener('drag'     , DragHandlers.drag , false);
		box.addEventListener('drop'     , DragHandlers.drop , false);
	};

};

function newBox (id, offsetX, offsetY) {
	var box = document.createElement('div');
	box.className = 'box';
	box.setAttribute("id", "box"+id);
	box.setAttribute("draggable", "true");
	box.setAttribute('ready', 'true');
	box.style.left = offsetX + 'px';
	box.style.top = offsetY + 'px';
	return box;
}


var DragElement;

var DragHandlers = {
	start : function(e) {
		// 	this = start node
		// console.log('start');
		this.classList.add('box_drag');
		e.dataTransfer.effectAllowed = 'copyMove';
		e.dataTransfer.setData('drag', 'drag');
		DragElement = this;
	},

	end : function(e) {
		// 	this = destination node
		// console.log('end');
		this.classList.remove('box_drag');
	},

	enter : function(e) {
		// console.log('enter');
		// 	this = destination node 
		if (this.getAttribute('ready') == 'true') {
			if (DragElement != this) {

				this.setAttribute('ready', 'false');
	
				// Move Animation using CSS3
				
				var X = DragElement.style.left;
				var Y = DragElement.style.top;
				var ID = DragElement.id;
				
				DragElement.style.left = this.style.left;
				DragElement.style.top = this.style.top;
				DragElement.id = this.id;
				
				this.style.left = X;
				this.style.top = Y;
				this.id = ID;
			}
		}
	},
	
	over : function(e) {
		// 	this = destination node 
		e.preventDefault();
	},

	leave : function(e) {
		// 	this = destination node
		// console.log('leave');
		this.setAttribute('ready', 'true'); 
	},

	drag : function(e) {
		// 	this = start node
	},

	drop : function(e) {
		// console.log('drop');
		// 	this = mouse relese (drop) on the "element"  
		DragElement.classList.remove('box_drag');
		this.setAttribute('ready', 'true');
	}
}

