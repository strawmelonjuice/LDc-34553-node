import express, { Express, Request, Response } from "express";
// import util from 'util';
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import mysql from "mysql";
import bcrypt from "bcrypt";

import Handlebars from "handlebars";
import UserAccountInteractions from "./UserAccountInteractions";
import tell from "./tell";
import { spawn } from "child_process";
function parseBool(bool: unknown) {
	if (bool === "true" || bool === "1" || bool === 1 || bool === true)
		return true;
	else return false;
}
if (!fs.existsSync(path.join(__dirname, "../.env"))) {
	tell.warn(
		`${path.join(__dirname, "../.env")} does not exist. Trying to create it.`,
	);
	try {
		fs.writeFileSync(
			path.join(__dirname, "../.env"),
			"PORT=8080\nDB-HOST=localhost\nDB-USER=user\nDB-PASS=password\nDB-NAME=ldcloud\nSESSION-COOKIE-SECRET='Goalaoe splorp'\n\n# As our existing database is still here, and is hashed using a PHP algorithm, we'll need to specify a port number for our internal PHP server.\nPHP-PARSER-PORT=8092",
		);
	} catch (err: unknown) {
		console.error(err);
		tell.fatal("Could not create .env file. Exiting.");
		process.exit(1);
	}
	tell.warn(".env file created! Please edit it and then restart.");
	process.exit(0);
} else {
	tell.log(
		1,
		"CONFIG",
		`Loading configuration from "${path.join(__dirname, "../.env")}".`,
	);
}
dotenv.config();
import session from "express-session";
import axios from "axios";
const PHPParserHTTP = `localhost:${process.env["PHP-PARSER-PORT"]}`;
declare module "express-session" {
	export interface SessionData {
		uid: number;
	}
}

const ahtime = new Date(Date.now());
const desfhu = `../logs/PHP_log_${ahtime.getDate()}-${ahtime.getMonth()}-${ahtime.getFullYear()}.log`;
const PHPParseProcess = spawn("php", [
	"-S",
	PHPParserHTTP,
	"-t",
	`${path.join(__dirname, "../src/php/")}`,
	"-d",
	`error_log=${path.join(__dirname, desfhu)}`,
]);
PHPParseProcess.stdout.on("data", (data: object) => {
	tell.log(0, "PHP", data.toString());
});
const db = mysql.createConnection({
	host: process.env["DB-HOST"],
	user: process.env["DB-USER"],
	password: process.env["DB-PASS"],
	database: process.env["DB-NAME"],
});
const AccountInteractions = new UserAccountInteractions(db);
db.connect(function (err) {
	if (err) {
		throw err;
	}
	tell.info("Connected to database!");
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
	// const preloadedresponses = {
	// 	html: {
	// 		index: HandlebarsAsHTML("./assets/hb/index.handlebars", vars),
	// 	},
	// };
	const app: Express = express();
	// const pino = require("pino-http")();
	// app.use(pino);
	app.use(express.json());
	app.use(require("body-parser").urlencoded({ extended: false }));
	let daSecret: string;
	if (process.env["SESSION-COOKIE-SECRET"] == null) {
		daSecret = "default";
	} else {
		daSecret = process.env["SESSION-COOKIE-SECRET"].toString();
	}
	app.use(
		session({
			secret: daSecret,
			resave: false,
			saveUninitialized: true,
			cookie: { secure: "auto" },
		}),
	);
	app.use("/assets", express.static(path.join(__dirname, "../assets/public")));

	app.get("/*", (req: Request, res: Response) => {
		let anyerrors: boolean;
		switch (req.url) {
			case "/":
				res.send(HandlebarsAsHTML("./assets/hb/index.handlebars", vars));
				// res.send(preloadedresponses.html.index);
				anyerrors = false;
				break;

			default:
				res.status(404);
				res.send("Not sure what you need.");
				anyerrors = true;
				break;
		}

		if (anyerrors) {
			tell.warn(`[GET] ➡️❌   "${req.url}"`);
		} else {
			tell.log(0, "OK", `[GET] ➡️✔️   "${req.url}"`);
		}
	});
	app.post("/api*", (req, res) => {
		// req.body;
		// res.json(req.body);
		let anyerrors = true;
		let uid;
		if (typeof req.session.uid !== "number" || req.session.uid == null) {
			if (req.body.ask === "ping") {
				res.send("pong");
				anyerrors = false;
			}
			const sql = `SELECT * FROM \`users\` WHERE \`username\` = "${req.body.username}"`;
			db.query(sql, function (err, result) {
				if (err) throw err;
				const data = result[0];
				const correctPasswordHashed = data.password;
				const userIdIfCorrect = parseInt(data.id);
				axios
					.post(
						`http://${PHPParserHTTP}`,
						{
							ask: "PasswordVerify",
							password: req.body.password,
							hashed_password: correctPasswordHashed,
						},
						{
							headers: {
								"Content-Type": "application/x-www-form-urlencoded",
							},
						},
					)
					.then(function (response) {
						// console.log(response);
						const passwordIsCorrectPHP = parseBool(response.data);
						const passwordIsCorrectBcrypt = parseBool(
							bcrypt.compareSync(req.body.password, correctPasswordHashed),
						);
						if (passwordIsCorrectPHP || passwordIsCorrectBcrypt) {
							tell.silly(`${req.body.username}: Successful login!`);
							uid = userIdIfCorrect;
							req.session.uid = userIdIfCorrect;
							anyerrors = false;
							req.session.save();
						}
					})
					.catch(function (error: Error) {
						console.log(error);
						res.status(401);
						res.send("SHOO!");
					});
			});
		} else {
			uid = req.session.uid;
		}
		if (typeof uid === "number") {
			switch (req.body.ask) {
				case "ping":
					res.send("pong");
					anyerrors = false;
					break;
				case "hoi": {
					const tablename: string = "userdata";
					anyerrors = false;

					AccountInteractions.get(uid, "settings", "focusmode");
				}
				break;
				default: {
					res.status(400);
					res.send("Not sure what you need.");
					anyerrors = true;
				}
				break;
			}
		}
		if (anyerrors) {
			tell.warn(`[POST] 👎  "${req.body.ask}"@"/api" `);
		} else {
			tell.log(0, "OK", `[POST] 👍  "${req.body.ask}"@"/api" `);
		}
	});

	app.listen(vars.port, () => {
		tell.info(`⚡️ Running at http://localhost:${vars.port}/`);
		tell.log(
			0,
			"PHP",
			`PHP parser as a child process on http://${PHPParserHTTP}`,
		);
	});
});
