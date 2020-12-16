const FENCE = /^\`\`\`(\s*)([\w_-]+)?\s*$/;

/**
 * Object for extracting code snippets from a markdown file.
 */
class Extractor{
	/**
      * Initialize the Extractor. 
      */
	constructor(){
	}

	/**
       * Extract code snippets from a markdown String.
       * @param {string} markdown Markdown to extract code snippets from. 
       */
	extract(markdown){
		if (typeof markdown === "undefined") throw new Error("Missing argument \"markdown\".");
		if(markdown === "") throw new Error("Argument \"markdown\" cannot be empty.");
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
					snippets.push(snippet);
					snippet = "";
				}
			}
			//not fence and in block add to snippet
			else if (inBlock !== false) {
				snippet += line + "\n";
			}
		});

		return snippets;
	}
}

module.exports = Extractor;