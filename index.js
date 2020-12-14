var Extractor = require("./lib/extractor/extractor");
var Downloader = require("./lib/extractor/downloader");

/**
 * @param {string} name 
 * @param {object} options 
 */
function get(name){
	var downloader = new Downloader();
	var readme = downloader.getREADME(name);
}

module.exports = {
	Extractor : Extractor,
	get : get
};