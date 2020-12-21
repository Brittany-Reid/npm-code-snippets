const FENCE = /^```(\s*)([\w_-]+)?\s*$/;

//aliases, https://github.com/github/linguist/blob/master/lib/linguist/languages.yml for more
const NODE_ALIAS = ["js", "node", "javascript"];
const NO_ALIAS = [""];

/**
 * Default options.
 */
var defaultOptions = {
	languageFilter: [...NODE_ALIAS, ...NO_ALIAS],
	whitelist: true,
};

/**
 * Object for extracting code snippets from a markdown file.
 */
class Extractor{
	/**
	 * Initialize the Extractor.
	 * @param {Object} options Options object.
	 * @param {Array} options.languageFilter Languages to filter with. By default acts as a whitelist.
	 * @param {boolean} options.whitelist Use options.languageFilter as a whitelist. By default set to true. If set to false, the language filter will act as a blacklist.
	 */
	constructor(options){
		this.options = Object.assign({}, defaultOptions);
		this.setOptions(options);
		/** Set of snippets. */
		this.snippets = [];
		/** Set of all snippets, including filtered out snippets. */
		this.allSnippets = [];
		/** Set of filtered snippets */
		this.filtered = [];
	}

	/**
	 * Set options, takes an object of options.
	 * Overwrites prevously set options with those specified.
	 * @param {Object} options 
	 */
	setOptions(options = {}){
		//for each field of given options, overwrite current options
		for (var [key, value] of Object.entries(options)) {
			this.options[key] = value;
		}
	}

	/**
       * Extract code snippets from a markdown String.
       * @param {string} markdown Markdown to extract code snippets from. 
       */
	extract(markdown){
		if (typeof markdown === "undefined") throw new Error("Missing argument \"markdown\".");
		if(markdown === "") throw new Error("Argument \"markdown\" cannot be empty.");

		//initialize
		this.allSnippets = [];

		//get lines
		var lines = markdown.split("\n");

		//for each line
		var inBlock = false;
		var snippet = {};
		lines.forEach((line) => {

			//if line is a code block fence
			var match = line.match(FENCE);
			if(match){
				//if not in block
				if(inBlock === false){
					//start new block
					inBlock = true;

					//new snippet
					snippet = {};
					snippet.language = match[2] || ""; //if undefined set to empty string
					snippet.code = "";
				}
				//if in block
				else{
					//finish block
					inBlock = false;
					
					this.allSnippets.push(snippet);
				}
			}
			//not fence and in block add to snippet
			else if (inBlock !== false) {
				snippet.code += line + "\n";
			}
		});


		//filter
		this.snippets = [];
		this.filtered = [];
		for(var s of this.allSnippets){
			if(this.filterLanguage(s.language)){
				this.snippets.push(s.code);
			}
			else{
				this.filtered.push(s);
			}
		}

		return this.snippets;
	}

	/**
	 * Given a code snippet and language, returns true if should be kept.
	 * @param {*} code 
	 * @param {*} langauge
	 */
	filterLanguage(langauge){
		var filter;

		//set the default value, based on whitelist
		if(this.options.whitelist) filter = false;
		else{
			filter = true;
		}

		//but if langauge filter is empty allow all snippets
		if(this.options.languageFilter.length === 0) filter = true;

		for(var l of this.options.languageFilter){
			if(langauge === l){
				if(this.options.whitelist) return true;
				else{
					return false;
				}
			}
		}

		return filter;
	}

	filteredLanguages(){
		var filtered = {};
		for(var snippet of this.filtered){
			if(!filtered[snippet.language]) filtered[snippet.language] = 0;
			filtered[snippet.language]+=1;
		}
		return filtered;
	}
}

/**
 * An array of aliases for node.js code. 
 */
Extractor.NODE_ALIAS = NODE_ALIAS;
/**
 * An array of aliases for code with no language specified.
 */
Extractor.NO_ALIAS = NO_ALIAS;

module.exports = Extractor;