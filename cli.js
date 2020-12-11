#!/usr/bin/env node

const { Command } = require('commander');
const Extractor = require('.');
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
program.option('-d, --debug', 'output extra debugging');

//argument
program.arguments("<package>");
program.action(function (package) {
    run(package)
});

//parse
program.parse(process.argv);

/**
 * Function to run the extraction of code snippets given a package name.
 * @param {string} name The name of the package to extract code snippets from.
 */
function run(name){
    console.log("Extracting code snippets for NPM package: " + name);
    Extractor.extractForName(name);
}

