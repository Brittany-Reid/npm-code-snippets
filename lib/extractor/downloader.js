var http = require("http");
var https = require("https");
var URL = require("url").URL;

const REGISTRY = "http://registry.npmjs.org/";
const GITHUB = "https://raw.githubusercontent.com/";
const READMEs = ["README.md", "README.markdown", "Readme.md", "Readme.markdown", "readme.md", "readme.markdown"];

/**
 * Default options.
 */
var defaultOptions = {
	registry: REGISTRY,
	filenames: READMEs,
};

/**
 * Object for downloading package information from online.
 */
class Downloader {
	/**
	 * Constructor, takes an optional options object.
	 * @param {Object} options Options object
	 * @param {string} options.registry  String registry URL, end with a slash. By default uses "http://registry.npmjs.org/".
	 * @param {Array} options.filenames  Array of String README names to bruteforce with.
	 */
	constructor(options) {
		//initialize options object
		this.options = Object.assign({}, defaultOptions);
		//set options
		this.setOptions(options);
		//possible errors
		this.errors = Downloader.errors;

		//events while trying to download are preserved
		//the events array is reset on getReadmes() call
		this.events = [];
	}

	/**
	 * Set options, takes an object of options.
	 * Overwrites prevously set options with those specified.
	 * @param {Object} options 
	 * @param {String} options.registry  String registry URL, end with a slash.
	 */
	setOptions(options = {}){
		//for each field of given options, overwrite current options
		for (var [key, value] of Object.entries(options)) {
			this.options[key] = value;
		}
	}

	/**
	 * Download a given URL.
	 * I'm having an issue with many asynchrous downloads, some hang.
	 * I've tried a bunch of things, to try to get requests that are done to go away.
	 * But looks like this.destroy() works, it made the batch examples go considerably faster.
	 * However, I really don't know why it works.
	 * This is an issue I always get even with packages mining using async node.js.
	 * 
	 * @param {string} url String URL to download.
	 */
	static async download(url) {
		var urlObject = new URL(url);
		var protocol;
		if (urlObject.protocol === "http:") {
			protocol = http;
		}
		else if (urlObject.protocol === "https:") {
			protocol = https;
		}

		//trying to get requests to close and not hang with these options
		var options = {
			agent: false,
			headers: { 'Connection':'Close',
			'User-Agent': 'npm-code-snippets'
			}
		}

		return new Promise(function (resolve, reject) {
			var request =  protocol.get(url, options, function (response) {
				if (response.statusCode !== 200) {
					this.destroy(); //KILL IT WITH FIRE
					reject(new HTTPStatusError("code " + response.statusCode + " for url " + url, url, response.statusCode));
				}
				var data = "";

				response.on("data", (chunk) => {
					data += chunk;
				});

				response.on("end", () => {
					this.destroy(); //AGAIN
					resolve(data);
				});
			});

			//error on request
			request.on("error", (e) => {
				request.destroy(); //HERE TOO
				reject(e);
			});

			request.end();
		});
	}


	/**
	 * Given a package name, downloads the registry entry.
	 * @param {String} name String name of the package to download.
	 * @returns {Object} registry data as a JSON object
	 * @throws Error if download fails.
	 * 
	 */
	async getRegistryData(name) {
		var url = this.options.registry + name;
		var registryData; 
		try{
			registryData = await this.constructor.download(url);
		}
		catch(e){
			if(e instanceof HTTPStatusError && e.statusCode === 404){
				throw new Error(this.errors.packageNotFound.replace("%s", name));
			}
			else if(e instanceof HTTPStatusError){
				throw new Error(this.errors.registryFailCode.replace("%s", name).replace("%d", e.statusCode));
			}
			else{
				throw new Error(this.errors.registryFail.replace("%s", name));
			}
		}
		registryData = JSON.parse(registryData);
		return registryData;
	}

	/**
	 * Given the GitHub repository URL from the registry repo field, constructs the URL for
	 * the raw README and returns it.
	 * @param {String} url GitHub URL to process, for example, https://github.com/user/repo
	 */
	processGithubURL(url){
		// get username/repo part of url
		var info = url.split("github.com/")[1];
		//split username and repo
		var parts = info.split("/");
		var user = parts[0];
		var repo = parts[1];

		//remove .git from end if exists
		if(repo.endsWith(".git")){
			repo = repo.replace(".git", "");
		}
		if(repo.startsWith("git@")){
			repo = repo.replace("git@", "https://");
		}

		return GITHUB + user + "/" + repo + "/master/";
	}

	/**
	 * Given the registry entry JSON, download the README from the package's reposutory.
	 * @param {Object} registryEntry Registry entry to extract repo information from.
	 * @returns String readme or undefined if no repository/repository is not GitHub.
	 * @throws Error if download was unsuccessful.
	 */
	async getReadmeFromRepo(registryEntry){
		//get url
		var url = registryEntry.repository && registryEntry.repository.url;
		if(!url){
			throw new Error(this.errors.noRepoURL);
		}

		//handle github repos
		var raw;
		//normalize these urls
		if(url.includes("github.com:")) url = url.replace("github.com:", "github.com/");
		if(url.includes("github.com/")){
			raw = this.processGithubURL(url);
		}
		else{
			throw new Error(this.errors.repoNotGithub.replace("%s", url));
		}

		//get filenmae
		var filename = registryEntry.readmeFilename;

		//if no filename get from most recent version field, must have version field
		if(!filename && registryEntry.versions){
			filename = this.getFilenameFromVersions(registryEntry);
		}

		//if still no filename try all options
		if(!filename){
			filename = this.options.filenames;
		}

		var readme;
		if(typeof filename === "string"){
			readme = await this.constructor.download(raw + filename);
		}
		else{
			var error;
			for(var i = 0; i<filename.length; i++){
				try{
					readme =  await this.constructor.download(raw + filename[i]);
				} catch(e){
					//save error to report later if necessary
					//if previous is not 404 dont overwrite, first weird error is what gets reported

					//if no error saved, save
					if(!error) error = e;
					//overwrite with most recent if we didnt get a weird error before
					if((error instanceof HTTPStatusError) && error.statusCode === 404){
						error = e;
					}
				}
				if(readme) break;
			}
			if(typeof readme === "undefined"){
				//404 error, expected if no readme for any name
				//we could be missing a common name or this is just an odd case
				if(error instanceof HTTPStatusError && error.statusCode === 404){
					throw new Error(this.errors.noReadmeInRepo);
				}
				//any other http status error, report the error
				else if(error instanceof HTTPStatusError){
					throw new Error(this.errors.repoDownloadFailCode.replace("%s", url).replace("%d", error.statusCode));
				}
				//any other error throw
				else{
					throw new Error(this.errors.repoDownloadFail.replace("%s", url));
				}
			}
		}

		return readme;
	}

	/**
	 * Get README data from the the versions field in the registry data.
	 * @param {Object} registryData 
	 */
	getReadmeFromVersions(registryData){
		var versions = registryData.versions;
		var versionIDs = Object.keys(versions);

		//make in newest to oldest order
		versionIDs.reverse();

		for(var v of versionIDs){
			var version = versions[v];

			//return the latest readme
			if(version.readme){
				return version.readme;
			}
		}

		//otherwise return nothing
		return undefined;
	}

	getFilenameFromVersions(registryData){
		var versions = registryData.versions;
		var versionIDs = Object.keys(versions);

		//make in newest to oldest order
		versionIDs.reverse();

		for(var v of versionIDs){
			var version = versions[v];

			//return the latest readme filename
			if(version.readmeFilename){
				return version.readmeFilename;
			}
		}

		//otherwise return nothing
		return undefined;
	}

	/**
     * Downloads the README file for the given package name.
     * @param {string} name String package name to get readme for.
	 * @param {Object} [registryData] Optional predownloaded registry data.
	 * @returns {Promise<string>} String readme for package name.
	 * @throws Error on failure to download registry data.
     */
	async getReadme(name, registryData) {
		this.events = [];

		if (typeof name === "undefined") throw new Error("Missing argument \"name\".");
		if(name === "") throw new Error("Argument \"name\" cannot be empty.");

		//get registry entry
		if(!registryData) registryData = await this.getRegistryData(name);
		if(typeof registryData.readme === "object"){
			throw new Error(this.errors.objectReadme);
		}

		//try to get the full readme file from github
		try{
			var readme = await this.getReadmeFromRepo(registryData);
		} catch(e){
			this.events.push(e.message);
		}

		
		//fallback to registry if no github
		if(!readme){
			readme = registryData.readme;

			//special npm error for no readme data
			if(readme === "ERROR: No README data found!"){
				//throw new Error(this.errors.noReadmeNPM.replace("%s", name));
				//we can actually get this and a readme in versions, so
				this.events.push(this.errors.noReadmeNPM);
				readme = undefined;
			}
		}

		//if still no
		if(!readme){
			//look at most recent version
			//looking at some of npms code it looks like they take 
			readme = this.getReadmeFromVersions(registryData);
		}

		//if still no readme
		if(!readme){
			throw new Error(this.errors.noReadme.replace("%s", name));
		}

		return readme;
	}
} 

//static vars

//we use these for testing as the actual error text may change
Downloader.errors = {
	"packageNotFound" : "Package not found.",
	"registryFailCode" : "Could not download registry data. Status code: %d.",
	"registryFail" : "Could not download registry data.",
	"noRepoURL": "No Repository",
	"repoNotGithub": "Repository hosted on unsupported site, for URL \"%s\". This package currently doesn't support mining sites besides GitHub.",
	"noReadmeInRepo": "No README in repository.",
	"repoDownloadFail": "Could not download README from repository for url \"%s\".",
	"repoDownloadFailCode": "Could not download README from repository for url \"%s\". Status code %d.",
	"noReadmeNPM": "NPM README error \"ERROR: No README data found!\".",
	"noReadme": "No README could be found.",
	"objectReadme": "README was an object."
};

/**
 * Error for HTTP status codes.
 */
class HTTPStatusError extends Error{
	/**
	 * Constructs a HTTP Status Code Error
	 */
	constructor(message, url, statusCode){
		super(message);
		this.name = this.constructor.name;
		this.url = url;
		this.statusCode = statusCode;
	}
}

module.exports = {
	Downloader : Downloader,
	HTTPStatusError : HTTPStatusError
};