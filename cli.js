#!/usr/bin/env node
const fs = require("fs");
const { Command } = require("commander");

const snippets = require("./lib");
const { Downloader } = require("./lib");

//get package details from package.json
const npm_package = require("./package.json");

// package details as consts
const NAME = npm_package.name;
const VERSION = npm_package.version;
const DESCRIPTION = npm_package.description;

//options
var save = false;
var verbose = false;

// setup commander
const program = new Command();
// information
program.name(NAME);
program.version(VERSION, "--version");
program.description(DESCRIPTION, {
	package: "NPM package name"
});
program.usage("<package> [options]");

//options
program.option("-v, --verbose", "output additional information");
program.option("-s, --save <path>", "save output to file");

//commands
//default get snippets
program.command("snippets <package>", {isDefault: true}).description("get snippets for <package>").action(function(package){
	snippet(package);
});

//get readme
program.command("readme <package>").description("get readme for <package>").action(function(package){
	readme(package);
});

// handle arguments
program.parse(process.argv);
if(program.save) save = true;
if(program.verbose) verbose = true;

function output(string){
	console.log(string);
}

function info(string){
	if(!verbose) return;
	console.log("INFO: " + string);
}

function noReadme(err, name, downloader){
	output("Could not download README for package \"" + name + "\".");
	if(!verbose){
		output("Try -v, --verbose to see additional information for this run.");
	} 
	var errors = downloader.events;
	errors.push(err.message);
        
	for(var e of errors){
		if(e === "No Repository"){
			info("No repository field, falling back to registry data.");
		}
		if(e === "No README could be found."){
			info("No README data available.");
		}
		if(e === "Package not found."){
			info("Package not found.");
		}
	}

}

async function snippet(name){
	output("Getting Snippets for package \"" + name + "\".");
    
	var results; 
	try{
		results = await snippets.get(name);
	} catch(e){
		if(e.message === "No README could be found."){
			var downloader = snippets.downloader;
			noReadme(e, name, downloader);
		}
		else{
			output("Cannot extract snippets for package \"" + name + "\".");
		}
        
		return;
	}
    
	if(!save){
		for(var s of results){
			output("---");
			output(s);
			output("---");
		}
	}
	else{
		var out = {
			name: name,
			snippets: results,
		};
		fs.writeFileSync(program.save, JSON.stringify(out));
		output("Saved at: " + program.save);
	}

}

async function readme(name){
	output("Getting README for package \"" + name + "\".");

	try{
		var downloader = new Downloader();
		var readme = await downloader.getReadme(name);
	}
	catch(e){
		noReadme(e, name, downloader);
		return;
	}
    
	if(!save){
		output(readme);
	}
	else{
		fs.writeFileSync(program.save, readme);
		output("Saved at: " + program.save);
	}
    

}