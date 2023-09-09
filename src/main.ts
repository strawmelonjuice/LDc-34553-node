import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { Logger, ILogObj } from "tslog";

const tell: Logger<ILogObj> = new Logger();
import fs from "fs";
const Handlebars = require("handlebars");
dotenv.config();
const vars = {
	port: process.env.PORT,
};
console.log(typeof vars);
function HandlebarsAsHTML(file: string, variables: object) {
	const template = fs.readFileSync(file).toString();
	// Compile said template
	const compiled = Handlebars.compile(template);
	const html = compiled(variables);
	return html;
}
const preloadedresponses: object = {
	html: {
		index: HandlebarsAsHTML("./assets/hb/index.handlebars", vars),
	},
};
const app: Express = express();
app.use(express.json());
app.use(require("body-parser").urlencoded({ extended: false }));

app.use("/assets", express.static(path.join(__dirname, "assets/public")));
app.get("/", (req: Request, res: Response) => {
	// res.send(preloadedresponses.html.index);
	res.send(HandlebarsAsHTML("./assets/hb/index.handlebars", vars));
	tell.log(0, "GET", "➡️  '/'");
});
app.post("*", (req, res) => {
	req.body;
	res.json(req.body);
	tell.log(0, "POST", "➡️ ''");
	console.log(req.body);
});

app.listen(vars.port, () => {
	tell.info(`⚡️ Running at http://localhost:${vars.port}`);
});
