const FENCE = /^\`\`\`(\s*)([\w_-]+)?\s*$/;

//aliases, https://github.com/github/linguist/blob/master/lib/linguist/languages.yml for more
const NODE_ALIAS = ["js", "node", "javascript"];
const NO_ALIAS = [undefined];

var defaultOptions = {
	languageFilter: [...NODE_ALIAS, ...NO_ALIAS],
};

/**
 * Object for extracting code snippets from a markdown file.
 */
class Extractor{
	/**
      * Initialize the Extractor. 
      */
	constructor(options){
		this.options = Object.assign({}, defaultOptions);
		this.filtered = new Set();
		this.setOptions(options);
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
		this.filtered = new Set();

		var snippets = [];

		var lines = markdown.split("\n");

		var inBlock = false;
		var snippet = "";
		var opening;
		lines.forEach((line, index) => {

			//if line is a code block fence
			var match = line.match(FENCE);
			if(match){
				//if not in block
				if(inBlock === false){
					//start new block
					snippet = "";
					opening = match;
					inBlock = true;
				}
				//if in block
				else{
					//finish block
					inBlock = false;
					
					var filter = this.filter(snippet, opening[2]);

					//if a valid snippet
					if(!filter){
						snippets.push(snippet);
						snippet = "";
					}
				}
			}
			//not fence and in block add to snippet
			else if (inBlock !== false) {
				snippet += line + "\n";
			}
		});

		return snippets;
	}

	/**
	 * Returns true if should be filtered.
	 * @param {string} snippet 
	 * @param {*} opening 
	 */
	filter(snippet, lang){
		//check block language tag
		var filter = true;
		for(var l of this.options.languageFilter){
			if(lang === l){
				return false;
			}
		}	

		//filtered
		this.filtered.add(lang);

		return filter;
	}
}

Extractor.NODE_ALIAS = NODE_ALIAS;
Extractor.NO_ALIAS = NO_ALIAS;

module.exports = Extractor;