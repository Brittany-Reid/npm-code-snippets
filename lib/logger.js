/**
 * Really simple logger
 */
class Logger{
	
	/**
	 * Writes a string message to output.
	 * @param {string} message 
	 */
	static write(message){
		if(this.output) this.output.write(message);
	}
	
	/**
	 * Writes a string message to output when debug is enabled only.
	 * @param {string} message 
	 */
	static debug(message){
		if(this.debugEnabled) this.write(message + "\n");
	}

	/**
	 * Writes a string message to output when info is enabled only.
	 * Info is used for the CLI.
	 * @param {string} message 
	 */
	static info(message){
		if(this.infoEnabled) this.write(message + "\n");
	}

}

//default static variables
Logger.output = process.stdout;
Logger.debugEnabled = false;
Logger.infoEnabled = false;

module.exports = Logger;