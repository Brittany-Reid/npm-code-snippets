var Extractor = require("./lib/extractor/extractor");
var {Downloader, HTTPStatusError} = require("./lib/extractor/downloader");


/**
 * 
 * @param {String} markdown String of markdown text.
 * @returns {Array} An Array of String code snippets.
 */
function extract(markdown){
	return [];
}

/**
 * For a package name, return an array of code snippets.
 * @param {string} name 
 * @param {object} options 
 */
async function get(name){
	var downloader = new Downloader();
	var readme = await downloader.getREADME(name);
	return readme;
	// var snippets = extract(readme);
	// return snippets;
}

module.exports = {
	extract : extract,
	get : get,
	Extractor : Extractor,
	Downloader : Downloader,
	HTTPStatusError : HTTPStatusError,
};