import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Logger, ILogObj } from "tslog";

const conn: Logger<ILogObj> = new Logger();
class martel {
	logfile: string;

	constructor(logfile: string) {
		this.logfile = logfile;
	}
	logtofile(cat: string, msg: string) {
		fs.writeFileSync(this.logfile, `\n[${cat} ${new Date().toLocaleTimeString()}] ${msg}`, {flag: "a",});
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
}
let logfilename;
let starttime;
{
	starttime = new Date(Date.now());
	logfilename = `./logs/log_${starttime.getDate()}-${starttime.getMonth()}-${starttime.getFullYear()}_${starttime.getHours()}.${starttime.getMinutes()}.log`;
}
if (!fs.existsSync("./logs")) {
	fs.mkdirSync("./logs");
}
const tell = new martel(logfilename);
// const tell: Logger<ILogObj>=new Logger();
if (!fs.existsSync(path.join(__dirname, "../.env"))) {
	tell.warn(
		`${path.join(__dirname, "../.env")} does not exist. Trying to create it.`,
	);
	try {
		fs.writeFileSync(
			path.join(__dirname, "../.env"),
			"PORT=8080\nDB-USER=user\nDB-PASS=password",
		);
	} catch (err: unknown) {
		console.error(err);
		tell.warn("Could not create .env file. Exiting.");
		process.exit(1);
	}
	tell.warn(".env file created! Please edit it and then restart.");
	process.exit(0);
} else {
	tell.log(
		1,
		"CONFIG",
		`Loading configuration from '${path.join(__dirname, "../.env")}'.`,
	);
}
const Handlebars = require("handlebars");
dotenv.config();

const vars = {
	port: process.env.PORT,
};
function HandlebarsAsHTML(file: string, variables: object) {
	const template = fs.readFileSync(file).toString();
	// Compile said template
	const compiled = Handlebars.compile(template);
	const html = compiled(variables);
	return html;
}
const preloadedresponses = {
	html: {
		index: HandlebarsAsHTML("./assets/hb/index.handlebars", vars),
	},
};
const app: Express = express();
app.use(express.json());
app.use(require("body-parser").urlencoded({ extended: false }));

app.use("/assets", express.static(path.join(__dirname, "../assets/public")));
app.get("/", (req: Request, res: Response) => {
	// res.send(preloadedresponses.html.index);
	res.send(preloadedresponses.html.index);
	tell.log(0, "GET", "➡️  '/'");
});
app.post("*", (req, res) => {
	req.body;
	res.json(req.body);
	tell.log(0, "POST", `➡️  '${req.body.ask}'`);
	// .log(req.body);
});

app.listen(vars.port, () => {
	tell.info(`⚡️ Running at http://localhost:${vars.port}`);
});
