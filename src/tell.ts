import { Logger, ILogObj } from "tslog";
// const conn = require("pino")();
import fs from "fs";
const conn: Logger<ILogObj> = new Logger();
class logging {
	logfile: string;

	constructor(logfile: string) {
		this.logfile = logfile;
		this.info(`Logging to "${logfilename}".`);
	}
	logtofile(cat: string, msg: string) {
		fs.writeFileSync(
			this.logfile,
			`\n[${cat} ${new Date().toLocaleTimeString()}] ${msg}`,
			{ flag: "a" },
		);
	}
	log(errorlevel: number, name: string, content: string) {
		conn.log(errorlevel, name, content);
		this.logtofile(name, content);
	}
	warn(content: string) {
		this.logtofile("WARN", content);
		conn.warn(content);
	}
	error(content: string) {
		this.logtofile("ERROR", content);
		conn.error(content);
	}
	info(content: string) {
		this.logtofile("INFO", content);
		conn.info(content);
	}
	silly(content: string) {
		this.logtofile("SILLY", content);
		conn.silly(content);
	}
	fatal(content: string) {
		this.logtofile("FATAL", content);
		conn.fatal(content);
	}
}
let logfilename: string;
let starttime: Date;
{
	starttime = new Date(Date.now());
	logfilename = `./logs/log_${starttime.getDate()}-${starttime.getMonth()}-${starttime.getFullYear()}.log`;
}
if (!fs.existsSync("./logs")) {
	fs.mkdirSync("./logs");
}
const tell = new logging(logfilename);
export default tell;
