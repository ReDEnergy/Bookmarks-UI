// JavaScript Document
var {Cc, Ci} = require("chrome");

var DirectoryService = Cc["@mozilla.org/file/directory_service;1"]
						.getService(Ci.nsIProperties)
						.get("ProfD", Ci.nsIFile);;
var StorageService = Cc["@mozilla.org/storage/service;1"]
						.getService(Ci.mozIStorageService);

export.connect = function connectDB(var database, Connection) {
	DirectoryService.append(database);
	Connection = StorageService.openDatabase(dbFile);
}