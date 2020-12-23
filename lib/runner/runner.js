var https = require("https");
var {URL} = require("url");

const endpoint = "https://execute-code-kqj4ikjptg03.runkit.sh/"; //todo: handle redirct from published

/**
 * Runner for running code using runkit.com. 
 * This was an experiment :)
 */
class Runner{
	constructor(){
	}
    
	/**
     * Runs string code. Returns true or false for if ran correctly.
     * @param {string} code 
     */
	async run(code){
		try{
			var response = await this.sendRequest(code);
			return response.ok;
		}
		catch(e){
			return false;
		}
	}

	constructData(code){
		var data = {
			code : code
		};

		return JSON.stringify(data);
	}
    
	sendRequest(code){
		var host = new URL(endpoint).host;
		var requestData = this.constructData(code);
		var options = {
			host: host,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": requestData.length
			}
		};
        
		return new Promise(function(reject, resolve){
			var req = https.request(options, (res) => {
				// console.log("statusCode:", res.statusCode);
				// console.log("headers:", res.headers);
				var data = "";
              
				res.on("data", (d) => {
					data += d;
				});
                
				res.on("end", ()=>{
					resolve(data);
				});
			});
              
			req.on("error", (e) => {
				reject(e);
			});
              
			req.write(requestData);
			req.end();
		});
	}
}

module.exports = Runner;