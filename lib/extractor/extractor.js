// const FENCE = /^```(\s*)([\w_-]+)?\s*$/; //move away from this
var marked = require("marked");

//aliases, https://github.com/github/linguist/blob/master/lib/linguist/languages.yml for more
const NODE_ALIAS = ["js", "node", "javascript"];
const NO_ALIAS = [""];

const OBJECT_ARRAY_OPEN = /({|\[)/;
const STRING = /"([^"\\]*(\\.[^"\\]*)*)"|\'([^\'\\]*(\\.[^\'\\]*)*)\'/;
const OBJECT = new RegExp(
	"(^" +
	OBJECT_ARRAY_OPEN.source +
	")|(^\\w+\\s?:\\s?" +
	OBJECT_ARRAY_OPEN.source +
	")|(^(" +
	STRING.source +
	")\\s?:\\s?" +
	OBJECT_ARRAY_OPEN.source +
	")"
);

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
		this.filteredLanguages = {};
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

	analyzeLines(markdown){
		var data = {
			readmeLines:0,
			hasInstallExample:false,
			hasRunExample: false,
		}

		var lines = markdown.split("\n");
		data.readmeLines = lines.length;

		for(var line of lines){
			line = line.trim().toLowerCase();
			if(line.length === 0) continue;
			if(line.startsWith("#")){
				if(line.includes("install")){
					data.hasInstallExample = true;
				}
				if(line.includes("usage")){
					data.hasRunExample = true;
				}
			}
			if(line.includes("npm run")) data.hasRunExample = true;
			if(line.includes("npm install")) data.hasInstallExample = true;
		}

		return data;
	}

	parse(markdown){
		var tokens = marked.lexer(markdown);
		var snippets = [];
		
		
		for(var token of tokens){
			if(token.type === "code"){
				snippets.push({lang: token.lang, code: token.text});
			}
		}

		return snippets;
	}

	/**
       * Extract code snippets from a markdown String.
       * @param {string} markdown Markdown to extract code snippets from. 
       */
	extract(markdown){
		if (typeof markdown === "undefined") throw new Error("Missing argument \"markdown\".");
		if (typeof markdown !== "string") throw new Error("Argument \"markdown\" must be of type string, got type " + typeof markdown + ".");
		if(markdown === "") throw new Error("Argument \"markdown\" cannot be empty.");

		//parse and get snippets
		this.allSnippets = this.parse(markdown);

		this.snippets = this.filter(this.allSnippets);

		return this.snippets;
	}
	
	filter(snippets){
		this.filtered = [];
		this.filteredLanguages = {};

		var keep = [];
		//filter by language
		for(var s of snippets){
			if(this.filterLanguage(s.lang)){
				keep.push(s);
			}
			else{
				if(!this.filteredLanguages[s.lang]){
					this.filteredLanguages[s.lang] = 1;
				}
				else{
					this.filteredLanguages[s.lang]++;
				}
				this.filtered.push(s);
			}
		}		

		snippets = keep;
		keep = [];

		for(var s of snippets){
			var k = true;
			for(var f of this.options.filters){
				if(!f(s.code)){
					k = false;
				}
			}
			if(k){
				keep.push(s.code);
			}
			else{
				this.filtered.push(s);
			}
		}

		return keep;
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

	static removeComments(code){
		//remove comments
		var newCode = "";
		var lines = code.split("\n");
		var comment = false;
		for (var i = 0; i < lines.length; i++) {
		  var line = lines[i].trim();
	  
		  if (line.startsWith("//")) {
		  } else if (!comment) {
			newCode += lines[i];
		  }
		}
	  
		return newCode;
	}

	static filterNPMCommand(code){
		code = code.trim().toLowerCase();
		code = Extractor.removeComments(code);

		if(code.startsWith("npm ")){
			return false;
		}


		return true;
	}

	static filterCommand(code){
		code = code.trim().toLowerCase();
		code = Extractor.removeComments(code);

		if(code.startsWith("bower install")){
			return false;
		}
		if(code.startsWith("install")){
			return false;
		}
		if(code.startsWith("yarn")){
			return false;
		}
		//starts with $ sign, representing a terminal. must have a space as js variables can start with $
		if(code.startsWith("$ ")){
			return false;
		}

		return true;
	}

	static filterObjects(code){
		code = code.trim().toLowerCase();
		code = Extractor.removeComments(code);

		if(code.match(OBJECT)){
			return false;
		}

		return true;
	}
}

/**
 * Default options.
 */
var defaultOptions = {
	languageFilter: [...NODE_ALIAS, ...NO_ALIAS],
	whitelist: true,
	filters: [Extractor.filterNPMCommand, Extractor.filterCommand, Extractor.filterObjects],
};


/**
 * An array of aliases for node.js code. 
 */
Extractor.NODE_ALIAS = NODE_ALIAS;
/**
 * An array of aliases for code with no language specified.
 */
Extractor.NO_ALIAS = NO_ALIAS;

module.exports = Extractor;