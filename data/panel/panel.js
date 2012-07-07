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
	var x = $('<div class="link box"></div>');
	
	var fav = $('<div class="fav"></div>');
	// fav.css('background-image','url('+Mark.fav+')');

	var text = $('<div class="text"></div>');
	x.append(text.append(fav).append(Mark.title));
	
	x.attr('cid', Mark.id);
	x.attr('parent', Mark.parent);
	x.attr('url', Mark.url);
	return x;
}


self.port.on("generate", function (marks) {
	Bookmark.root.html('');
	for (var i in marks) {
		var elem = Element(marks[i]);
		Bookmark.root.append(elem);	
	}
});



self.port.on("bookmark", function (bookmark) {
	Bookmark.root.html(bookmark);
});




/**
 **	Navigation buttons - GUI
 **/

 
/*
$('.folder').live('click', function (){
	self.port.emit("GetNew", $(this).attr('cid'));
	Bookmark.parent.push($(this).attr('parent'));
	Bookmark.path.push($(this).children('.text').html());
	$('.path').html($(this).children('.text').html());
	$('.back').toggle(true);
});
*/
 
$('.link').live('mousedown', function (e){
	self.port.emit("OpenLink", $(this).attr('url') , e.button);
});


$('.path').live('mousedown', function (e) {
	if(e.button > 0)
		self.port.emit("OpenAll");
});
 
$('.back').click( function(){
	if (Bookmark.path.length > 1) {
		Bookmark.path.pop();
		$('.path').html(Bookmark.path[Bookmark.path.length-1]);
		self.port.emit("GoBack", Bookmark.parent.pop());
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

self.port.on ("NewPref", function (Pref) {
	Bookmark.root.css('height', (Pref.height - 80) + 'px');
//	$('#f3 .box').css('width', Pref.mark - 30 + 'px');
	
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

$(document).ready(function(e) {
	
});