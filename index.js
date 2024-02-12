import express from "express";
import { fileURLToPath } from "url";
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use("/files", express.static(path.join(__dirname, "files")));

const port = 3001;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});