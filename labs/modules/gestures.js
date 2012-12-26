/*
 * This scripts goes into main Addon script
 */

require("page-mod").PageMod({

	include: ["*", "about:*", "file://*", "resource:*"],

	contentScriptFile:[data.url("gestures.js")],

	contentScriptWhen: "ready",
	
	attachTo: ["existing", "top"],

	onAttach: function (worker) {
		// *	Show Bookmarks UI panel
		worker.port.on("show", function (){ 
			panel.show();
		});
	}
});

/*
 * This goes into the script inserted
 */

/*
 * Add mouse gestures for opening the panel
 * Usage	Click on the left edge of the document - mouse X position 0
 */

document.addEventListener('mousedown', function (e) {
	if (e.clientX == 0)
		self.port.emit('show');
});	
