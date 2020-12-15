var http = require("http");
var https = require("https");
var URL = require("url").URL;

const REGISTRY = "http://registry.npmjs.org/";
const GITHUB = "https://raw.githubusercontent.com/";
const READMEs = ["README.md", "README.markdown", "Readme.md", "Readme.markdown"];

//Default options
var defaultOptions = {
	//by default uses the NPM registry at registry.npmjs.org
	registry: REGISTRY
};

/**
 * Object for downloading package information from online.
 */
class Downloader {
	/**
	 * Constructor, takes an optional options object.
	 * @param {Object} options Options object
	 * @param {String} options.registry  String registry URL, end with a slash.
	 */
	constructor(options) {
		//initialize options object
		this.options = Object.assign({}, defaultOptions);
		//set options
		this.setOptions(options);
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
	 * Given a package name, downloads the registry entry.
	 * @param {String} name String name of the package to download.
	 * @throws Error on failure to download registry entry.
	 */
	async getRegistryEntry(name) {
		var url = this.options.registry + name;
		var registryEntry;
		registryEntry = download(url);
		return registryEntry;
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
			//return nothing
			return;
		}

		//handle github repos
		if(url.includes("github.com/")){
			url = this.processGithubURL(url);
		}
		else{
			//return nothing
			return;
		}

		//get filenmae
		var filename = registryEntry.readmeFilename;
		//if no filename try
		if(!filename){
			filename = READMEs;
		}

		var readme;
		if(typeof filename === "string"){
			readme = await download(url + filename);
		}
		else{
			for(var i = 0; i<filename.length; i++){
				try{
					readme =  await download(url + filename[i]);
				} catch(e){
					//catch and do nothing
				}
				if(readme) break;
			}
			if(typeof readme === "undefined"){
				//throw this error if still no readme
				//we may be missing a common readme name or this repo has no readme
				//throw this error because we might want to check manually
				throw new Error("unable to download readme for github repo");
			}
		}

		return readme;
	}

	/**
     * Downloads the README file for the given package name.
     * @param {string} name 
     */
	async getREADME(name) {
		if (typeof name === "undefined") throw new Error("Missing argument name.");
		if(name === "") throw new Error("Argument name cannot be empty.");

		//get registry entry
		var registryEntry = await this.getRegistryEntry(name);
		//parse to JSON
		registryEntry = JSON.parse(registryEntry);
		
		//try to get the full readme file from github
		var readme = await this.getReadmeFromRepo(registryEntry);
		
		if(!readme){
			readme = registryEntry.readme;
		}

		return readme;
	}
}

//private functions

/**
 * Download a given URL.
 * @param {string} url String URL to download.
 */
async function download(url) {
	var urlObject = new URL(url);
	var protocol;
	if (urlObject.protocol === "http:") {
		protocol = http;
	}
	else if (urlObject.protocol === "https:") {
		protocol = https;
	}
	return new Promise(function (resolve, reject) {
		var request =  protocol.get(url, function (response) {
			if (response.statusCode !== 200) {
				reject(new HTTPStatusError("code " + response.statusCode + " for url " + url, url, response.statusCode));
			}
			var data = "";

			response.on("data", (chunk) => {
				data += chunk;
			});

			response.on("end", () => {
				resolve(data);
			});
		});

		//error on request
		request.on("error", (e) => {
			reject(e);
		});
	});
}

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