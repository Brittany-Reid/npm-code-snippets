require("mocha");
var assert = require("assert");
const { Extractor } = require("..");

describe("Extractor", function () {
	describe("unit tests", function () {
		describe("extract()", function(){
			it("Should throw error when no markdown argument", function() {
				var extractor = new Extractor();
				assert.throws(() =>{ extractor.extract();});
			});
			it("Should throw error on empty markdown argument", function() {
				var extractor = new Extractor();
				assert.throws( () =>{ extractor.extract("");});
			});
			it("Should extract a code snippet", function(){
				var extractor = new Extractor();
				var snippet = "var a = 0;\n"
                + "console.log(\"a\");";
				var markdown = "This is a markdown string\n"
                + "```\n"
                + snippet + "\n"
                + "```\n";
				var snippets = extractor.extract(markdown);
				assert.strictEqual(snippets[0], snippet);
			});
			it("Should be able to filter out snippets", function(){
				var extractor = new Extractor();
				var snippet = "var a = 0;\n"
                + "console.log(\"a\");\n";
				var markdown = "This is a markdown string\n"
                + "```sh\n"
                + snippet
                + "```\n";
				var snippets = extractor.extract(markdown);
				assert.strictEqual(snippets.length, 0);
			});
			it("Should work for escaped", function(){
				var extractor = new Extractor();
				var snippet = "```\n"
				+ "console.log(\"a\");\n"
				+ "```\n";
				var markdown = "This is a markdown string\n"
				+ "````\n"
				+ snippet + "\n"
                + "````\n";
				var snippets = extractor.extract(markdown);
				assert.strictEqual(snippets[0], snippet);
			});
		});
		describe("filterLanguage()", function(){
			it("Should filter in empty for default lang filter", function(){
				var extractor = new Extractor();
				var filter = extractor.filterLanguage("");
				assert.strictEqual(filter, true);
			});
			it("Should filter in node for default lang filter", function(){
				var extractor = new Extractor();
				var filter = extractor.filterLanguage("node");
				assert.strictEqual(filter, true);
			});
			it("Should filer out sh for default lang filter", function(){
				var extractor = new Extractor();
				var filter = extractor.filterLanguage("sh");
				assert.strictEqual(filter, false);
			});
			it("Should show all snippets when no filter", function(){
				var extractor = new Extractor({languageFilter : []});
				var filter = extractor.filterLanguage("ruby");
				assert.strictEqual(filter, true);
			});
			it("Should allow blacklisting", function(){
				var extractor = new Extractor({languageFilter : ["sh"], whitelist:false});
				var filter = extractor.filterLanguage("sh");
				assert.strictEqual(filter, false);
			});
		});
		describe("filteredLanguages", function(){
			it("Should return filtered languages after extraction", function(){
				var extractor = new Extractor();
				var snippet = "var a = 0;\n"
                + "console.log(\"a\");\n";
				var markdown = "This is a markdown string\n"
                + "```sh\n"
                + snippet
				+ "```\n"
				+ "```sh\n"
                + snippet
                + "```\n";
				extractor.extract(markdown);
				var filtered = extractor.filteredLanguages;
				assert.strictEqual(filtered["sh"], 2);
			});
		});
	});
});