// JavaScript Document

// *	Object for storing user settings
function settings () {
	this.width = null;
	this.height = null;
	this.combo = null;
	this.image = null;
	this.opacity = null;
	this.theme = null;
}

// *	Object for getting user settings from the page
var get_settings = {
	width : function () {
		return parseInt( $('.value').first().html() )
	},
	height : function () {
		return parseInt( $('.value').last().html() );
	},
	combo : function (callback) {
		var combo = $('.key').html();
		$('.hkey').each(function(index, element) {
			if ($(this).hasClass('hkey_in_use')) 
				combo += '1';
			else
				combo += '0';
		});
		callback (combo);
	},
	opacity : function () {
		return parseInt( $('.opacity').html() );
	},
	image : function () {
		return $('.preview').attr('image');
	},
	theme : function () {
		if ( $('#white').attr('checked') )
			return 1;
		else return 2;
	}
}

// *	Get Settings
var save = new settings;

$('#apply').click ( function () {
	$.when().done(save_settings).done(send_settings);
});

function save_settings() {
//	console.log ("Saving settings");
	save.width = get_settings.width();
	save.height = get_settings.height();
	get_settings.combo(	function(x) {
		save.combo = x;
	});
	save.image = get_settings.image();
	save.opacity = get_settings.opacity();
	save.theme = get_settings.theme();
}

function send_settings() {
//	console.log ("Sending settings");
	self.port.emit("apply", save );
}

// *	Get user settings and overwrite those from the page
self.port.on ('current_settings', function ( settings ){
	// *	Set current dimensions
	$('.value').first().html( settings.width );
	$('.value').last().html( settings.height );
	$('.currentdim').html ( settings.width + " width * "+ settings.height + " height");
	
	// *	Show current key ( classes color )
	$('.key').html( settings.combo[0]);
	var first = $('.hkey').first();	
	for ( i=1; i<=3; i++ ) {
		if ( settings.combo[i] == '1')
			first.toggleClass('hkey_in_use',true);
		first = first.next();
	}
	
	// *	Store current binar val
	var val = parseInt( settings.combo[1]) + 2 * parseInt(settings.combo[2]) + 4 * parseInt(settings.combo[3]);
	$('#info').html(val);
	
	// *	Show current hotkey
	var currentkey='';
	var keys = ['Ctrl+','Shift+','Alt+'];
	for (i=1; i<=3; i++)
		if (settings.combo[i] == '1')
			currentkey += keys[i-1];
	currentkey += settings.combo[0];		
	$('.currentkey').html('Current hotkey: ' + currentkey);
	
});
