import express from "express";
import { fileURLToPath } from "url";
import path from 'path';
import serveIndex from "serve-index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use("/files", express.static("files"), serveIndex("files", { icons: true }));

const port = 3001;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});