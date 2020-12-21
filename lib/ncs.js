var {Downloader} = require("./extractor/downloader");
const Extractor = require("./extractor/extractor");

/**
 * The main class of npm code snippets.
 */
class NCS{
	constructor(){
		this.downloader = undefined;
		this.extractor = undefined;
	}

	/**
	 * Given a package name, download and extract code snippets.
	 * @param {string} name String package name.
	 */
	async get(name){
		this.downloader = new Downloader();
		var readme = await this.downloader.getReadme(name);
        
		this.extractor = new Extractor();
		var snippets = this.extractor.extract(readme);
        
		return snippets;
	}
}

module.exports = NCS;