const snippets = require("..");
const { Extractor, Downloader } = require("..");

async function main(){
	var results = await snippets.get("express");
	console.log(results);
    
	var downloader = new Downloader();
	var readme = await downloader.getReadme("express");
	console.log(readme);

	var extractor = new Extractor();
	results = extractor.extract(readme);
	console.log(results);
}

main();