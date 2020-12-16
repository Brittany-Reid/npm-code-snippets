var http = require("http");
var https = require("https");
var URL = require("url").URL;
var Logger = require("./logger");

const REGISTRY = "http://registry.npmjs.org/";
const GITHUB = "https://raw.githubusercontent.com/";
const READMEs = ["README.md", "README.markdown", "Readme.md", "Readme.markdown"];

//Default options
var defaultOptions = {
	//by default uses the NPM registry at registry.npmjs.org
	registry: REGISTRY,
	//list of readme names to bruteforce with
	filenames: READMEs,
};

/**
 * Object for downloading package information from online.
 */
class Downloader {
	/**
	 * Constructor, takes an optional options object.
	 * @param {Object} options Options object
	 * @param {string} options.registry  String registry URL, end with a slash.
	 * @param {Array} options.registry  Array of String README names to bruteforce with.
	 */
	constructor(options) {
		//initialize options object
		this.options = Object.assign({}, defaultOptions);
		//set options
		this.setOptions(options);
		this.errors = {
			"packageNotFound" : "Package \"%s\" not found.",
			"registryFailCode" : "Could not download registry data for package \"%s\". Status code: %d.",
			"registryFail" : "Could not download registry data for package \"%s\".",
			"noRepoURL": "Registry data has no repository or repository URL field.",
			"repoNotGithub": "Repository hosted on unsupported site, for URL \"%s\". We currently don't support mining sites besides GitHub.",
			"noReadmeInRepo": "README not found in repository.",
			"repoDownloadFail": "Could not download README from repository for url \"%s\".",
			"repoDownloadFailCode": "Could not download README from repository for url \"%s\". Status code %d.",
			"noReadmeNPM": "NPM README error \"ERROR: No README data found!\" for package \"%s\".",
			"noReadme": "No README could be found for package \"%s\"."
		};
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
		if(url.includes("github.com/")){
			raw = this.processGithubURL(url);
		}
		else{
			throw new Error(this.errors.repoNotGithub.replace("%s", url));
		}

		//get filenmae
		var filename = registryEntry.readmeFilename;
		//if no filename try
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
     * Downloads the README file for the given package name.
     * @param {string} name String package name to get readme for.
	 * @returns {String} String readme for package name.
	 * @throws Error on failure to download registry data.
     */
	async getReadme(name) {
		if (typeof name === "undefined") throw new Error("Missing argument \"name\".");
		if(name === "") throw new Error("Argument \"name\" cannot be empty.");

		//get registry entry
		var registryData = await this.getRegistryData(name);
		
		//try to get the full readme file from github
		try{
			var readme = await this.getReadmeFromRepo(registryData);
		} catch(e){
			//
		}
		
		//if no readme from github
		if(!readme){
			//fallback to registry
			readme = registryData.readme;

			//special npm error for no readme data
			if(readme === "ERROR: No README data found!"){
				throw new Error(this.errors.noReadmeNPM.replace("%s", name));
			}
		}

		//if still no readme
		if(!readme){
			throw new Error(this.errors.noReadme.replace("%s", name));
		}

		return readme;
	}
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