require("mocha");
var assert = require("assert");
const { Extractor } = require("..");

describe("Extractor", function () {
	describe("unit tests", function () {
		// describe("constructor", function(){
        
		// });
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
                + "console.log(\"a\");\n";
				var markdown = "This is a markdown string\n"
                + "```\n"
                + snippet
                + "```\n";
				var snippets = extractor.extract(markdown);
				assert.strictEqual(snippets[0], snippet);
			});
		});
		describe("filter()", function(){
			it("Should return false for empty for default lang filter", function(){
				var extractor = new Extractor();
				var filter = extractor.filter("", undefined);
				assert.strictEqual(filter, false);
			});
			it("Should return false for node for default lang filter", function(){
				var extractor = new Extractor();
				var filter = extractor.filter("", "node");
				assert.strictEqual(filter, false);
			});
			it("Should filer out sh for default lang filter", function(){
				var extractor = new Extractor();
				var filter = extractor.filter("", "sh");
				assert.strictEqual(filter, true);
			});
		});
	});
});