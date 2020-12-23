const Extractor = require("./extractor/extractor");
const { Downloader } = require("./extractor/downloader");


/**
 * Main class.
 * Simplified snippet getter.
 */
class Snippets{
	/**
     * For a given NPM package name, downloads the README and returns an array of extracted code snippets.
	 * 
	 * The internal extractor and downloader instances are accessible.
	 * 
     * @param {string} name Name of the package to get code snippets for.
     * @returns {Promise<string[]>} Array of string code snippets from the package.
     */
	static async get(name){
		var snippets;

		Snippets.downloader = new Downloader();
		Snippets.extractor = new Extractor();

		var readme = await Snippets.downloader.getReadme(name);
		if(readme){
			snippets = await Snippets.extractor.extract(readme);
		}

		return snippets;
	}
}


module.exports = Snippets;