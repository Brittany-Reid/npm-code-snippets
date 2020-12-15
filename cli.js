#!/usr/bin/env node

const { Command } = require("commander");
const { HTTPStatusError } = require(".");
const snippets = require(".");
const npm_package = require("./package.json");

//package details
const NAME = npm_package.name;
const VERSION = npm_package.version;
const DESCRIPTION = npm_package.description;

//setup commander
const program = new Command();

//information
program.name(NAME);
program.version(VERSION);
program.description(DESCRIPTION, {
	package: "NPM package to get code snippets from."
});

//options
program.option("-d, --debug", "output extra debugging");

//argument
program.arguments("<package>");
program.action(function (package) {
	run(package);
});

//parse
program.parse(process.argv);

/**
 * Function to run the extraction of code snippets given a package name.
 * @param {string} name The name of the package to extract code snippets from.
 */
async function run(name){
	console.log("Extracting code snippets for NPM package: " + name);
	try{
		var readme = await snippets.get(name);
	} catch(e){
		if(e instanceof HTTPStatusError){
			//not found error
			if(e.statusCode === 404){
				console.log("Package \"" + name + "\" could not be found.");
				return;
			}
			else{
				//for other errors print the error and just that we couldn't download it.
				console.log("Error: " + e.message);
				console.log("Unable to download package manifest for package \"" + name + "\".");
				return;
			}
		}
		//any non status error, unable:
		console.log("Unable to download package manifest for package \"" + name + "\".");
		return;
	}
	console.log(readme);
}

