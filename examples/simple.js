const snippets = require("..");
const { Extractor, Downloader } = require("..");
const fs = require("fs");

async function main(){

	//get express code snippets
	var results = await snippets.get("express");
	console.log(results);
	
	//get express readme
	var downloader = new Downloader();
	var readme = await downloader.getReadme("express");
	console.log(readme);

	//get code snippets from that readme
	var extractor = new Extractor();
	results = extractor.extract(readme);
	console.log(results);

}

main();