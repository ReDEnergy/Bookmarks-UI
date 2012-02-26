// JavaScript Document
if(unsafeWindow.top==unsafeWindow.self) {
	document.addEventListener('mousedown', function doSomething(e) {
		var posx = 0;
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) 	{
			posx = e.pageX;
		}
		else if (e.clientX || e.clientY) 	{
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
		}
		if (posx == 0)
			self.port.emit('show');
	});	
/*		
	$(document).ready(function(e) {
		var x = $('<div></div>');
		x.attr('id','openB-UI');
		x.css('background','#ddd');
		x.css('height','100%');
		x.css('width','5px');
		x.css('position','fixed');
		x.css('left','0px');
		x.css('top','0px');
		$('body').append(x);
	});
	
	$('#openB-UI').live('click', function () {
		self.port.emit('show');
	});
*/	
}