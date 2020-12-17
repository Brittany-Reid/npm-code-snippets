#!/usr/bin/env node

const { Command } = require("commander");
const { HTTPStatusError } = require(".");
const ncs = require(".");
const Logger = require("./lib/extractor/logger");
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

if(program.debug) Logger.debugEnabled = true;


/**
 * Function to run the extraction of code snippets given a package name.
 * @param {string} name The name of the package to extract code snippets from.
 */
async function run(name){
	//enable info for cli
	Logger.infoEnabled = true;

	Logger.info("Extracting code snippets for NPM package: " + name);
	var snippets;
	try{
		snippets = await ncs.get(name);
	} catch(e){
		Logger.info("Unable to generate snippets for package \"" + name + "\".");
	}
	if(snippets){
		for(var s of snippets){
			console.log([s]);
			console.log("\n----------------\n\n");
		}
	}
}

