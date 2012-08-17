// *	Bookmarks rows

var Bookmark = {
	root	:	document.getElementById('f3'),
	navpath : 	document.getElementById('nav').children[0], 
	navback : 	document.getElementById('nav').children[1], 
	navloc	:	['Bookmarks Toolbar'],
	fav		: 	{
		0	: 	'fav_uri',
		5	: 	'fav_query',
		6	: 	'fav_folder',
		9	: 	'fav_query',
	}
};

/**************************************************************************************************************
 **************************************************************************************************************/

function Element(Mark) {
	var box = document.createElement('div');
	var fav = document.createElement('div');
	var title = document.createElement('div');


	fav.className = Bookmark.fav[Mark.type];

	if (Mark.type == 0 && Mark.fav)
		fav.style.backgroundImage = 'url('+Mark.fav+')';

	box.className = 'box';
	box.setAttribute('id', Mark.id);
	box.setAttribute('type', Mark.type);

	title.className = 'title';
	title.innerHTML = Mark.title;
	
	box.appendChild(fav);
	box.appendChild(title);
	
	console.log(Mark.fav);
	
	return box;
}


/**
 **	Navigation buttons - GUI
 **/

document.addEventListener('click' , function (e) {
	var target = e.target;
	
	// console.log("Click target: " + target.id);
	// console.log("Target className: " + target.className);
	
	// *	Open Addon Settings Page
	
	if (target.className == 'settings') { 
		self.port.emit ("open_homepage");
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
			Bookmark.navpath.innerHTML = Bookmark.navloc[Bookmark.navloc.length-1];
			self.port.emit("goBack");
		}
		
		if (Bookmark.navloc.length == 1)
			Bookmark.navback.removeAttribute('style');
		
		return;
	}

	if (target.parentNode.className == 'box') {
		console.log(target.innerHTML);
		target = target.parentNode;
	}

	if (target.className == 'box') {
		type = target.getAttribute('type');
		id = target.getAttribute('id');
		
		if (type == 0) {
			self.port.emit("openURI", id, e.button);
		}

		else {
			self.port.emit("getMarksFrom", id);
			var title = target.children[1].innerHTML;
			Bookmark.navloc.push(title);
			Bookmark.navpath.innerHTML = title;
			Bookmark.navback.style.display = 'block';
		}

		return;
	}
	
});


var Events = {
	folderClick : function (target) {
		self.port.emit("getMarksFrom", target.getAttribute('id'));
		var title = target.children[1].innerHTML;
		Bookmark.navloc.push(title);
		Bookmark.navpath.innerHTML = title;
		Bookmark.navback.style.display = 'block';
	},

	openURI : function (target) {
		self.port.emit("openURI", target.getAttribute('id'), e.button);
	}

}




// **********************************************************************************
// *	Addon Communication	


// *	Receive Bookmarks
self.port.on("loadMarks", function (marks) {
	Bookmark.root.innerHTML = ''; 
	for (var i in marks) {
		var elem = Element(marks[i]);
		Bookmark.root.appendChild(elem);	
	}
	
});


// *	Receive Panel Settings
self.port.on ("newPref", function (Pref) {
	Bookmark.root.style.height = Pref.height - 80 + 'px';
	
	// *	Background
	switch (Pref.image) {
		case 'default':
			document.body.removeAttribute('style');
			break;
			
		case 'same':
			break;
			
		default:
			document.body.style.background = 'url('+Pref.image+') center no-repeat';
	}
});

