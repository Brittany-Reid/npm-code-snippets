var Extractor = require("./lib/extractor/extractor");
var {Downloader, HTTPStatusError} = require("./lib/extractor/downloader");
const NCS = require("./lib/ncs");

module.exports = {
	NCS : NCS,
	Extractor : Extractor,
	Downloader : Downloader,
	HTTPStatusError : HTTPStatusError,
};