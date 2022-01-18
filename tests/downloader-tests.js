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
		describe("constructor", function(){
			it("Should be able to set registry option", function() {
				//use replicate
				var replicate = "https://replicate.npmjs.com/";
				var downloader = new Downloader({registry : replicate});
				assert.strictEqual(downloader.options.registry, replicate);
			});
		});
		describe("download()", function(){
			it("Should work for http", async function(){
				var data = await Downloader.download("http://www.google.com/");
				assert.strictEqual(typeof data, "string");
			}).timeout(0);
			it("Should work for https", async function(){
				var data = await Downloader.download("https://www.google.com/");
				assert.strictEqual(typeof data, "string");
			}).timeout(0);
			it("Should throw HTTP Status Error on 404", async function(){
				await assert.rejects(async () => {await Downloader.download("https://httpstat.us/404");}, HTTPStatusError);
			}).timeout(0);
			it("Should throw error for no connection", async function(){
				await assert.rejects(async () => {await Downloader.download("https://http/");}, Error);
			}).timeout(0);
		});
		describe("getRegistryData()", function(){
			it("Should get registry entry for a package", async function(){
				var downloader = new Downloader();
				var registryData = await downloader.getRegistryData("mocha");
				assert.strictEqual(typeof registryData, "object");
			}).timeout(0);
			it("Should throw Error when can't find package name", async function(){
				var downloader = new Downloader();
				var package = " _"; //invalid package name
				//should error 404
				await assert.rejects(async () => {await downloader.getRegistryData(package);}, Error(downloader.errors.packageNotFound.replace("%s", package)));
			}).timeout(0);
			it("Should throw Error when some other HTTP error", async function(){
				var downloader = new Downloader();
				var package = "npm/cli"; //missing scope @ url is not formatted correctly
				//should error 405
				await assert.rejects(async () => {await downloader.getRegistryData(package);}, Error(downloader.errors.registryFailCode.replace("%s", package).replace("%d", 405)));
			}).timeout(0);
			it("Should throw Error when no connection", async function(){
				//change registry so download fails
				var registry = "http://htt p"; //some registry that isnt a real url
				var downloader = new Downloader({registry:registry});
				var package = "@npm/cli"; //actual npm package
				//should then error
				await assert.rejects(async () => {await downloader.getRegistryData(package);}, Error(downloader.errors.registryFail.replace("%s", package)));
			}).timeout(0);
		});
		//moved to github miner
		// describe("processGithubURL()", function(){
		// 	it("Should construct raw URL for repository URL", async function(){
		// 		var repo = "https://github.com/brittany-reid/npm-code-snippets";
		// 		var downloader = new Downloader();
		// 		var url = downloader.processGithubURL(repo);
		// 		//download our own readme
		// 		var readme = await Downloader.download(url + "README.md");
		// 		assert.strictEqual(typeof readme, "string");
		// 	}).timeout(0);
		// 	it("Should handle .git", async function(){
		// 		var repo = "https://github.com/brittany-reid/npm-code-snippets.git";
		// 		var downloader = new Downloader();
		// 		var url = downloader.processGithubURL(repo);
		// 		//download our own readme
		// 		var readme = await Downloader.download(url + "README.md");
		// 		assert.strictEqual(typeof readme, "string");
		// 	}).timeout(0);
		// 	it("Should handle git+", async function(){
		// 		var repo = "git+https://github.com/brittany-reid/npm-code-snippets";
		// 		var downloader = new Downloader();
		// 		var url = downloader.processGithubURL(repo);
		// 		//download our own readme
		// 		var readme = await Downloader.download(url + "README.md");
		// 		assert.strictEqual(typeof readme, "string");
		// 	}).timeout(0);
		// });
		describe("getReadmeFromRepo()", function(){
			it("Should get readme from repo", async function(){
				var downloader = new Downloader();
				//mock data
				var data = {
					readmeFilename : "README.md",
					repository:{
						url: "https://github.com/brittany-reid/npm-code-snippets.git"
					}
				};
				var readme = await downloader.getReadmeFromRepo(data);
				assert.strictEqual(typeof readme, "string");
			}).timeout(0);
			it("Should bruteforce for no filename", async function(){
				var downloader = new Downloader();
				//mock data
				var data = {
					repository:{
						url: "https://github.com/brittany-reid/npm-code-snippets.git"
					}
				};
				var readme = await downloader.getReadmeFromRepo(data);
				assert.strictEqual(typeof readme, "string");
			}).timeout(0);
			it("Should look in version if no filename", async function(){
				var downloader = new Downloader();
				//mock data
				var data = {
					repository:{
						url: "https://github.com/brittany-reid/npm-code-snippets.git"
					},
					versions: {
						"1.0.0" : {
							readmeFilename : "README.md"
						}
					}
				};
				var readme = await downloader.getReadmeFromRepo(data);
				assert.strictEqual(typeof readme, "string");
			}).timeout(0);
			it("Should error when no url field", async function(){
				var downloader = new Downloader();
				//mock data
				var data = {
					readmeFilename : "",
					repository:{
						url : "",
					}
				};
				await assert.rejects(async () => {await downloader.getReadmeFromRepo(data);}, Error(downloader.errors.noRepoURL));
			}).timeout(0);
			it("Should error when not github url", async function(){
				var downloader = new Downloader();
				//mock data
				var data = {
					readmeFilename : "",
					repository:{
						url : "https://bitbucket/pack/name",
					}
				};
				await assert.rejects(async () => {await downloader.getReadmeFromRepo(data);}, Error(downloader.errors.repoNotGithub.replace("%s", data.repository.url)));
			}).timeout(0);
			it("Should error when no readme can be found", async function(){
				var downloader = new Downloader();
				//mock data
				//some github repo that doesn't exist (can 1 letter repo/users exist?)
				var data = {
					readmeFilename : "",
					repository:{
						url : "https://github.com/g/g",
					}
				};
				//expect a 404 download error then we process this as not found
				await assert.rejects(async () => {await downloader.getReadmeFromRepo(data);}, Error(downloader.errors.noReadmeInRepo));
			}).timeout(0);
			it("Should error when HTTP error that's not 404", async function(){
				//change filenames to one that will trigger a 400
				var downloader = new Downloader({filenames: ["bad name/"]});
				//mock data
				var data = {
					readmeFilename : "",
					repository:{
						url : "https://github.com/npm/cli",
					}
				};
				//expect a 400 download error
				var error = Error(downloader.errors.repoDownloadFailCode.replace("%s", data.repository.url).replace("%d", 400));
				await assert.rejects(async () => {await downloader.getReadmeFromRepo(data);}, error);
			}).timeout(0);
			it("Should error when non HTTP error", async function(){
				var downloader = new Downloader();
				
				//overwrite the download function
				var oldDownload = Downloader.download;
				Downloader.download = async function(){
					throw new Error("non http error");
				};

				//mock data
				var data = {
					readmeFilename : "",
					repository:{
						url : "https://github.com/npm/cli",
					}
				};

				//should handle error correctly
				var error = Error(downloader.errors.repoDownloadFail.replace("%s", data.repository.url));
				await assert.rejects(async () => {await downloader.getReadmeFromRepo(data);}, error);
				//change it back!
				Downloader.download = oldDownload;
			}).timeout(0);
		});
		describe("getReadmeFromVersions()", function(){
			it("Should get README from version field", function(){
				var downloader = new Downloader();
				var data = {
					versions: {
						"1.0.0":{
							readme : "this is a readme"
						}
					}
				};
				var readme = downloader.getReadmeFromVersions(data);
				assert.strictEqual(typeof readme, "string");
			});
		});
		describe("getReadme()", function(){
			it("Should throw error when no name argument", async function() {
				var downloader = new Downloader();
				await assert.rejects(async () =>{ await downloader.getReadme();});
			});
			it("Should throw error on empty name argument", async function() {
				var downloader = new Downloader();
				await assert.rejects(async () =>{ await downloader.getReadme("");});
			});
			it("Should download a README", async function() {
				var downloader = new Downloader();
				//package we're using for our tests!
				var readme = await downloader.getReadme("@npm/decorate");
				assert(typeof readme === "string");
			}).timeout(0);
			// actually can get a readme from versions sometimes when this happens, so dont error
			// it("Throw error for NPM's No README found error", async function(){
			// 	var downloader = new Downloader();
			// 	//this is a broken package on the npmjs.com site
			// 	var name = "@npm/css-reset";
			// 	var error = Error(downloader.errors.noReadmeNPM.replace("%s", name));
			// 	await assert.rejects(async () =>{ await downloader.getReadme(name);}, error);
			// 	//assert(readme === "ERROR: No README data found!");
			// }).timeout(0);
			it("Should fallback to readme entry on registry if no repository field", async function(){
				var downloader = new Downloader();
				//this package has no repository field but a readme
				var readme = await downloader.getReadme("testpackage");
				var entry = downloader.getRegistryData("testpackage");
				assert(!entry.repository && typeof readme === "string");
			}).timeout(0);
		});
	});
});