// *	Bookmarks rows

var Bookmark = {
	type	:	[null, 'link box', 'folder box', 'separator'],
	root	:	$('#f3'),
	parent	:	[],
	path	:	['Bookmarks Toolbar'],
};

/**************************************************************************************************************
 **************************************************************************************************************/

function Element(Mark) {
	var x = $('<div></div>');
	
	var fav = $('<div class="fav"></div>');
	
	if (Mark.type == 0) {
		x.addClass("box link")
		if (Mark.fav != null && Mark.fav != undefined)
			fav.css('background-image','url('+Mark.fav+')');
	}
		
	if (Mark.type == 6)
		x.addClass("box folder");
		

	var text = $('<div class="text"></div>');
	x.append(text.append(fav).append(Mark.title));
	
	x.attr('uid', Mark.id);
	x.attr('parent', Mark.parent);
	x.attr('url', Mark.url);
	return x;
}


self.port.on("loadMarks", function (marks) {
	Bookmark.root.html('');
	for (var i in marks) {
		var elem = Element(marks[i]);
		Bookmark.root.append(elem);	
	}
});



/**
 **	Navigation buttons - GUI
 **/

 
$('.folder').live('click', function (){
	self.port.emit("getMarksFrom", $(this).attr('uid'));
	Bookmark.parent.push($(this).attr('parent'));
	Bookmark.path.push($(this).children('.text').html());
	$('.path').html($(this).children('.text').html());
	$('.back').toggle(true);
});
 
$('.link').live('mousedown', function (e){
	self.port.emit("openLink", $(this).attr('url') , e.button);
});


$('.path').live('mousedown', function (e) {
	if(e.button > 0)
		self.port.emit("openAll");
});
 
$('.back').click( function(){
	if (Bookmark.path.length > 1) {
		Bookmark.path.pop();
		$('.path').html(Bookmark.path[Bookmark.path.length-1]);
		self.port.emit("goBack", Bookmark.parent.pop());
	}
	
	if (Bookmark.path.length == 1)
		$('.back').toggle(false);
});
 

/**************************************************************************************************************
**************************************************************************************************************/

// *	Panel Settings
$('.button').click( function() {	
	self.port.emit ("open_homepage");	
});

self.port.on ("newPref", function (Pref) {
	Bookmark.root.css('height', (Pref.height - 80) + 'px');
	
	// *	Background
	switch (Pref.image) {
		case 'default':
			$('body').css('background','url(../images/background.jpg) center no-repeat');
			break;
		case 'same':
			break;
		default:
			$('body').css('background','url('+Pref.image+') center no-repeat');
	}
	$('body').css('background-size', 'cover');
});

