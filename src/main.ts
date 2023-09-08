import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { Logger, ILogObj } from "tslog";

const tell: Logger<ILogObj> = new Logger();
import fs from "fs";

dotenv.config();
const preloadedresponses = {
  html: {
    index: fs.readFileSync("./assets/html/index.html").toString()
  }
}

const app: Express = express();
const port = process.env.PORT;
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send(preloadedresponses.html.index);
  tell.log(0, "REQUEST","➡️  GET '/'");
});

app.post('*', (req, res) => {
  req.body;
  res.json(req.body);
});

app.listen(port, () => {
  tell.info(`⚡️ Running at http://localhost:${port}`);
});