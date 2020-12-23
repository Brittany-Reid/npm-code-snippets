// #!/usr/bin/env node

// const { Command } = require("commander");
// const {NCS} = require(".");
// const Logger = require("./lib/logger");
// const Runner = require("./lib/runner/runner");
// const npm_package = require("./package.json");

// //package details
// const NAME = npm_package.name;
// const VERSION = npm_package.version;
// const DESCRIPTION = npm_package.description;

// //setup commander
// const program = new Command();

// //information
// program.name(NAME);
// program.version(VERSION);
// program.description(DESCRIPTION, {
// 	package: "NPM package to get code snippets from."
// });

// //options
// program.option("-d, --debug", "output extra debugging");

// //argument
// program.arguments("<package>");
// program.action(function (package) {
// 	run(package);
// });

// program.command("run <package>").action(function(package){
// 	test(package);
// });


// //parse
// program.parse(process.argv);

// if(program.debug) Logger.debugEnabled = true;


// /**
//  * Function to run the extraction of code snippets given a package name.
//  * @param {string} name The name of the package to extract code snippets from.
//  */
// async function run(name){
// 	//enable info for cli
// 	Logger.infoEnabled = true;

// 	var ncs = new NCS();

// 	Logger.info("Extracting code snippets for NPM package: " + name);
// 	var snippets;
// 	try{
// 		snippets = await ncs.get(name);
// 	} catch(e){
// 		console.log(e);
// 		Logger.info("Unable to generate snippets for package \"" + name + "\".");
// 	}
// 	if(snippets){
// 		console.log("");
// 		for(var s of snippets){
// 			console.log(s);
// 			console.log("\n----------------\n\n");
// 		}
// 	}
// }

// async function test(name){
// 	var ncs = new NCS();
// 	var snippets;
// 	try{
// 		snippets = await ncs.get(name);
// 	} catch(e){
// 		console.log(e);
// 		Logger.info("Unable to generate snippets for package \"" + name + "\".");
// 	}
// 	if(snippets){
// 		console.log("");
// 		var count = 0;
// 		for(var s of snippets){
// 			//console.log(s);
// 			var runner = new Runner();
// 			var ran = await runner.run(s);
// 			if(ran){
// 				console.log("Pass");
// 				count++;
// 			}
// 			else{
// 				console.log("Fail");
// 			}
// 			console.log(ran);
// 		}
// 	}
// }