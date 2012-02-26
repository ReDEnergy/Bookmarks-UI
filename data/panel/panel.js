// *	Bookmarks rows
var _typeof = [, 'link', 'folder', 'separator'];
var level = 1;
var _B = $('#f3');
var _parent = null;
var _path = ['Bookmarks Toolbar'];

/**************************************************************************************************************
 **************************************************************************************************************/

function Element(Mark) {
	var x = $('<div></div>');
	var type = _typeof[Mark.type];
	
	if (Mark.type != 3 ) {
		var fav = $('<div class="favicon"></div>');
		if (Mark.type == 1) {
			if (Mark.fav == null)
				fav.css('background-image','url(../images/fav.png)');
			else
				fav.css('background-image','url('+Mark.fav+')');
		}
		x.append(fav);

		var text = $('<div class="text"></div>');
		text.append(Mark.title);
		x.append(text);

	}
	
	x.addClass(type);
	x.attr('cid', Mark.id);
	x.attr('parent', Mark.parent);
	x.attr('url', Mark.url);
	return x;
}


self.port.on("generate", function (marks) {
	_B.html('');
	
	for (var i in marks) {
		if (marks[i].type != 3)
		var elem = Element(marks[i]);
		_B.append(elem);	
	}
	
});

 
$('.folder').live('click', function (){
	self.port.emit("GetNew", $(this).attr('cid'));
	_parent = $(this).attr('parent');
	_path.push($(this).children('.text').html());
	$('.path').html($(this).children('.text').html());
	$('.back').toggle(true);
});
 
$('.link').live('mousedown', function (e){
	self.port.emit("OpenLink", $(this).attr('url') , e.button);
});

$('.path').live('click', function () {
	self.port.emit("OpenAll");
});
 
$('.back').click( function(){
	if (_path.length > 1) {
		_path.pop();
		$('.path').html(_path[_path.length-1]);
		self.port.emit("GoBack", _parent);
	}
	
	if (_path.length == 1)
		$('.back').toggle(false);
});
 

 /**************************************************************************************************************
 **************************************************************************************************************/

// *	Panel Settings
$('.button').click( function() {	
	self.port.emit ("open_homepage");	
});

self.port.on ("new_settings", function (set) {
	// *	Set the dimensions
	$('#panel').css('width', set.width );
	$('#f3').css('max-height', set.height - 100);

	// *	Set the background	
	if (set.image) {
		$('body').css('background','url('+set.image+') center top no-repeat');
		$('body').css('background-attachment','fixed');
	}
});