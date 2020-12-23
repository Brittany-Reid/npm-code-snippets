// /*
//  * 
//  */

// var names = require("all-the-package-names"); //this package is outdated now but the easiest way to do this quickly
// const { Downloader, Extractor} = require("..");

// //top 10 most popular
// names = names.slice(0, 1000);

// main();

// async function main(){
// 	for(var name of names){
// 		await get(name);
// 	}
// }

// async function doPool(pool){
// 	for(var p of pool){
// 		console.log("start: " + p);
// 		get(p);
// 		console.log("end " + p);
// 	}
// }

// async function get(name){
// 	var readme;
// 	try{
// 		readme = await new Downloader().getReadme(name);
// 	} catch(e){
// 		console.log("fail: " + name);
// 		//do nothing
// 	}
// 	return readme;		
// }

// function sleep(ms) {
// 	return new Promise((resolve) => {
// 		setTimeout(resolve, ms);
// 	});
// }   