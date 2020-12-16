var Extractor = require("./lib/extractor/extractor");
var {Downloader, HTTPStatusError} = require("./lib/extractor/downloader");
const Logger = require("./lib/extractor/logger");


/**
 * 
 * @param {String} markdown String of markdown text.
 * @returns {Array} An Array of String code snippets.
 */
function extract(markdown){
	var extractor = new Extractor();
	var snippets = extractor.extract(markdown);
	return snippets;
}

/**
 * For a package name, return an array of code snippets.
 * @param {string} name 
 * @param {object} options 
 * @throws Error if unable to download README.
 */
async function get(name){
	var downloader = new Downloader();
	try{
		var readme = await downloader.getReadme(name);
	} catch(e){
		throw(new Error("Could not get README for package + \"" + name + "\"."));
	}
	var snippets = extract(readme);
	return snippets;
}

module.exports = {
	extract : extract,
	get : get,
	Extractor : Extractor,
	Downloader : Downloader,
	HTTPStatusError : HTTPStatusError,
};