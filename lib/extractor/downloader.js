var http = require("http");
var https = require("https");
var URL = require("url").URL;

const REGISTRY = "http://registry.npmjs.org/";
const GITHUB = "https://raw.githubusercontent.com/";
const READMEs = ["README.md", "README.markdown", "Readme.md", "Readme.markdown"];

/**
 * Object for downloading packages from online.
 */
class Downloader {
	/**
	 * Constructor, takes an optional options object.
	 * @param {object} options
	 */
	constructor(options) {
		//by default uses the NPM registry at registry.npmjs.org
		this.options = {
			registry : options || REGISTRY,
		};
	}

	/**
	 * Given a package name, downloads the registry entry.
	 * @param {String} name 
	 */
	async getRegistryEntry(name) {
		var url = this.options.registry + name;
		var registryEntry;
		try {
			registryEntry = download(url);
		} catch (e) {
			if(typeof e !== Error){
				console.log("Error " + e + ": Unable to find package " + name );
			}
			else{
				console.log(e);
			}
		}
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
	 * Given the registry information, download the README from the package's reposutory.
	 * @param {*} registryEntry Registry entry to extract repo information from.
	 */
	async getReadmeFromRepo(registryEntry){
		//get url
		var url = registryEntry.repository && registryEntry.repository.url;
		if(!url){
			return;
		}

		//handle github repos
		if(url.includes("github.com/")){
			url = this.processGithubURL(url);
		}
		else{
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
			try{
				readme =  await download(url + filename);
			} catch(e){
				//
			}
		}
		else{
			for(var i = 0; i<filename.length; i++){
				try{
					readme =  await download(url + filename[i]);
				} catch(e){
					//
				}
				if(readme) break;
			}
		}

		return readme;
	}

	/**
     * Downloads the README file for the given package name.
     * @param {string} name 
     */
	async getREADME(name) {
		//get registry entry
		var registryEntry = await this.getRegistryEntry(name);
		if(!registryEntry) return;
		//parse to JSON
		registryEntry = JSON.parse(registryEntry);
		
		//try to get the full readme file from github
		var readme = await this.getReadmeFromRepo(registryEntry);
		
		if(!readme){
			console.log("Could not find README on github.");
			readme = registryEntry.readme;
		}

		console.log(readme);
	}
}

//private functions
/**
 * Download a given URL.
 * @param {string} url String URL to download.
 */
async function download(url) {
	// url = "http://httpstat.us/300"
	var protocol = new URL(url).protocol;
	var client;
	if (protocol === "http:") {
		client = http;
	}
	else if (protocol === "https:") {
		client = https;
	}
	return new Promise(function (resolve, reject) {
		var request = client.get(url, function (response) {
			if (response.statusCode !== 200) {
				reject(response.statusCode);
				return;
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
			return;
		});
	});
}

module.exports = Downloader;