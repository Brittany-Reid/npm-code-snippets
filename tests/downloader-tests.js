require("mocha");
var assert = require("assert");
const { Downloader, HTTPStatusError } = require("..");

/**
 * Test cases for the Downloader Class.
 * All tests accessing the internet should have no timeout.
 * Possible for some of these packages to change and thus no longer pass tests.
 */
describe("Downloader", function () {
	describe("unit tests", function () {
		it("Should download a README", async function() {
			var downloader = new Downloader();
			//package we're using for our tests!
			var readme = await downloader.getREADME("mocha");
			assert(typeof readme === "string");
		}).timeout(0);
		it("Should throw error when no name argument", async function() {
			var downloader = new Downloader();
			await assert.rejects(async () =>{ await downloader.getREADME();});
		});
		it("Should throw error on empty name argument", async function() {
			var downloader = new Downloader();
			await assert.rejects(async () =>{ await downloader.getREADME("");});
		});
		it("Should throw error when can't find package", async function() {
			var downloader = new Downloader();
			//leading spaces are not allowed
			await assert.rejects(async () =>{ await downloader.getREADME(" invalid");}, HTTPStatusError);
		}).timeout(0);
		it("Should be able to set registry option", function() {
			//use replicate
			var replicate = "https://replicate.npmjs.com/";
			var downloader = new Downloader({registry : replicate});
			assert.strictEqual(downloader.options.registry, replicate);
		});
		it("Should work with scoped packages", async function(){
			var downloader = new Downloader();
			//use one of npms packages for this
			var readme = await downloader.getREADME("@npm/decorate");
			assert(typeof readme === "string");
		}).timeout(0);
		it("No README found error", async function(){
			var downloader = new Downloader();
			//this is a broken package on the npmjs.com site
			var readme = await downloader.getREADME("@npm/css-reset");
			assert(readme === "ERROR: No README data found!");
		}).timeout(0);
		it("Should fallback to readme entry on registry if no repository field", async function(){
			var downloader = new Downloader();
			//this package has no repository field but a readme
			var readme = await downloader.getREADME("testpackage");
			var entry = downloader.getRegistryEntry("testpackage");
			assert(!entry.repository && typeof readme === "string");
		}).timeout(0);
		it("Should bruteforce if no filename", async function(){
			var downloader = new Downloader();
			var registryEntry = {
				name: "npm/cli",
				filename: "",
				repository:{
					url : "https://github.com/npm/cli"
				}
			};
			var readme = await downloader.getReadmeFromRepo(registryEntry);
			assert.strictEqual(typeof readme, "string");
		}).timeout(0);
		it("Ignore non github urls", async function(){
			var downloader = new Downloader();
			var registryEntry = {
				name: "somepackage",
				filename: "",
				repository:{
					url : "http://bitbucket.com/somepackage"
				}
			};
			var readme = await downloader.getReadmeFromRepo(registryEntry);
			assert.strictEqual(typeof readme, "undefined");
		}).timeout(0);
		it("Throw error if no readme at github", async function(){
			var downloader = new Downloader();
			var registryEntry = {
				name: "npm/cli/_d",
				filename: "",
				repository:{
					url : "http://github.com/npm/cli_d"
				}
			};
			await assert.rejects(async () =>{ await downloader.getReadmeFromRepo(registryEntry);});
		}).timeout;
	});
});