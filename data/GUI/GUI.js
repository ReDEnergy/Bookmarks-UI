// *	Bookmarks rows

var Bookmark = {
	type	:	[null, 'link box', 'folder box', 'separator'],
	root	:	$('#gui'),
	parent	:	[],
	path	:	['Bookmarks Toolbar'],
};



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

$( "#gui" ).sortable({
	placeholder: "box box_drop",
	revert: true
});
