// *	Bookmarks rows

var Bookmark = {
	root	:	document.getElementById('f3'),
	path	:	['Bookmarks Toolbar'],
};

/**************************************************************************************************************
 **************************************************************************************************************/

function Element(Mark) {
	var box = document.createElement('div');
	var fav = document.createElement('div');
	var title = document.createElement('div');

	box.setAttribute('type', 2);
	
	switch (Mark.type) {
		case 0 : 	// URI
			box.className = 'box link';
			fav.className = 'fav_uri';
			if (Mark.fav)
				fav.style.backgroundImage = 'url('+Mark.fav+')';
			break;

		case 5 :
			box.className = 'box folder';
			fav.className = 'fav_query';
			break;

		case 6 :
			box.className = 'box folder';
			fav.className = 'fav_folder';
			break;

		case 9 :
			box.className = 'box folder';
			fav.className = 'fav_query';
			break;
		
		default :
			break;
		
	}

	title.className = 'title';
	title.innerHTML = Mark.title;

	box.setAttribute('id', Mark.id);
	
	box.appendChild(fav);
	box.appendChild(title);
	
	return box;
}


self.port.on("loadMarks", function (marks) {
	Bookmark.root.innerHTML = ''; 
	for (var i in marks) {
		var elem = Element(marks[i]);
		Bookmark.root.appendChild(elem);	
	}
});



/**
 **	Navigation buttons - GUI
 **/

document.addEventListener('click' , function (e) {
	target = e.target;
	
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

		if (Bookmark.path.length > 1) {
			Bookmark.path.pop();
			$('.path').html(Bookmark.path[Bookmark.path.length-1]);
			self.port.emit("goBack");
		}
		
		if (Bookmark.path.length == 1)
			$('.back').toggle(false);
		
		return;
	}


	if (target.classList.contains('title')) {
		target = target.parentNode;
		if (target.classList.contains('folder')) {

			self.port.emit("getMarksFrom", target.getAttribute('id'));
			var title = target.children[1].innerHTML;
			Bookmark.path.push(title);
			$('.path').html(title);
			$('.back').toggle(true);
		}

		else {
			self.port.emit("openLink", target.getAttribute('id'), e.button);
		}

		return;
	}
	
});




/*************************************************************************************************************
**************************************************************************************************************/

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

