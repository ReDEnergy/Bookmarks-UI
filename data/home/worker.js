// JavaScript Document

// *	Store User Settings - Save
var Pref = {
	width:	300,
	height:	400,
	combo:	['Q', 1, 0, 0],
	image:	0,
	mouse:	[0, 1, 1],
}

// *	Get User Settings From The Page
var Settings = {
	width : function () {
		Pref.width = parseInt( $('.value').first().html() )
	},
	height : function () {
		Pref.height = parseInt( $('.value').last().html() );
	},
	combo : function () {
		Pref.combo.splice(1,3,0,0,0);
		Pref.combo[0] = String($('.key').html());
		$('.hkey').each( function ( i, element) {
			if ($(this).hasClass('hkey_in_use'))
				Pref.combo[i+1] = 1;
		});
	},
	mouse : function () {
		Pref.mouse[0] = $('#leftclick').val()
		Pref.mouse[1] = $('#middleclick').val()
		Pref.mouse[2] = $('#rightclick').val()
	},
	
	image : function () {
		Pref.image = $('.preview').attr('image');
	},
	get : function () {
		this.width();
		this.height();
		this.mouse();
		this.image();
		this.combo();
	},
	send : function () {
		self.port.emit("apply", Pref );
	}
}

$('#apply').click ( function () {
	$.when().done(Settings.get(), Settings.send());
});

// *	Get user prefereces and overwrite those from the page
self.port.on ('CurrentPref', function ( Pref ){
	// *	Set current dimensions
	$('.value').first().html( Pref.width );
	$('.value').last().html( Pref.height );
	$('.currentdim').html ( Pref.width + " width * "+ Pref.height + " height");
	
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
	
	// *	Mouse actions
	$('#leftclick').val(Pref.mouse[0]);	
	$('#middleclick').val(Pref.mouse[1]);	
	$('#rightclick').val(Pref.mouse[2]);
});
