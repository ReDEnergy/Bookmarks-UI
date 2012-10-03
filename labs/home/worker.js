// JavaScript Document

// *	Store User Settings - Save
var Preferences = {};

// *	Get User Settings From The Page
var Settings = {
	marks : function () {
		Preferences.number = $('#marksNo').val();
	},
	height : function () {
		Preferences.height = $('#PanelHeight').val();
	},
	combo : function () {
		Preferences.combo.splice(1,3,0,0,0);
		Preferences.combo[0] = String($('.key').html());
		$('.hkey').each( function ( i, element) {
			if ($(this).hasClass('hkey_in_use'))
				Preferences.combo[i+1] = 1;
		});
	},
	mouse : function () {
		Preferences.mouse[0] = $('#leftclick').val()
		Preferences.mouse[1] = $('#middleclick').val()
		Preferences.mouse[2] = $('#rightclick').val()
	},
	
	image : function () {
		Preferences.image = $('#preview').attr('image');
	},
	get : function () {
		this.marks();
		this.height();
		this.mouse();
		this.image();
		this.combo();
	},
	send : function () {
		self.port.emit("apply", Preferences );
	}
}


document.getElementById("apply").addEventListener('click' , function () {
	$.when().done(Settings.get(), Settings.send());
});

// *	Get user prefereces and overwrite those from the page
self.port.on ('currentPref', function ( Pref ){
	
	Preferences = Pref;
	
	// *	Show current key ( classes color )
	$('.key').html( Pref.combo[0]);
	var first = $('.hkey').first();	
	for ( i=1; i<=3; i++ ) {
		if ( Pref.combo[i] == '1')
			first.toggleClass('hkey_in_use',true);
		first = first.next();
	}
	
	// *	Store current binar val
	var val = parseInt( Pref.combo[1]) + 2 * parseInt(Pref.combo[2]) + 4 * parseInt(Pref.combo[3]);
	$('#info').html(val);
	
	// *	Show current hotkey
	var currentkey='';
	var keys = ['Ctrl+','Shift+','Alt+'];
	for (i=1; i<=3; i++)
		if (Pref.combo[i] == '1')
			currentkey += keys[i-1];
	currentkey += Pref.combo[0];		
	$('.currentkey').html('Current hotkey: ' + currentkey);

	// *	Panel Dimensions
	$('#marksNo').val(Pref.number);	
	$('#PanelHeight').val(Pref.height);

	// *	Mouse actions
	$('#leftclick').val(Pref.mouse[0]);
	$('#middleclick').val(Pref.mouse[1]);	
	$('#rightclick').val(Pref.mouse[2]);
	
	// *	Pannel Wallpaper
	$('#preview').css('background','url('+Pref.image+') center no-repeat');	
	$('#preview').css("background-size",'contain');
	
	$('.version').html("Version : " + Pref.version);
});
