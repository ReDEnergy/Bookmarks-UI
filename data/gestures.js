/*
 * Add mouse gestures for opening the panel
 * Usage	Click on the left edge of the document - pageX = 0
 */

if (window.location == window.parent.location) {
	
	console.log("blea");
	
	document.addEventListener('mousedown', function doSomething(e) {
		var posx = 0;

		if (!e) 
			var e = window.event;
		
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
}
