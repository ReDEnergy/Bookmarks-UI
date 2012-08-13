/*
 * Add mouse gestures for opening the panel
 * Usage	Click on the left edge of the document - mouse X position 0
 */

if (window.location == window.parent.location) {
	document.addEventListener('mousedown', function (e) {
		if (e.clientX == 0)
			self.port.emit('show');
	});	
}
