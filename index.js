import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import multer from "multer";
import bodyParser from "body-parser";
import jsdompkg from "jsdom";
const { JSDOM } = jsdompkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "1000mb" }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, req.body.folderPath);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname.replaceAll(" ", "_"));
  },
});

const upload = multer({ storage: storage });

const myServe = fs.readFileSync(
  path.join(__dirname, "/myServe/index.html"),
  "utf-8"
);
const dom = new JSDOM(myServe);
const document = dom.window.document;

const listingPath = path.join(__dirname, "files");
app.use("/files", (req, res) => {
  console.log(req.path, listingPath)
  const filePath = path.join(listingPath, req.path);

  // if (!fs.existsSync(filePath)) {
  //   return res.status(404).end();
  // }

  const videoExtensions = new Set([
    ".mp4",
    ".avi",
    ".mkv",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".3gp",
    ".mpeg",
    ".mpg",
    ".mpe",
    ".ogv",
  ]);

  if (fs.statSync(filePath).isDirectory()) {
    const filesInDir = fs.readdirSync(filePath);
    document.title = path.basename(filePath);

    const filesEl = document.querySelector(".files");
    filesEl.innerHTML = "";

    const homeEl = document.createElement("a");
    homeEl.className = "item home";
    homeEl.textContent = "🏠 Главная";
    homeEl.href = "/files";
    const backEl = document.createElement("a");
    backEl.className = "item back";
    backEl.textContent = "⬅️ Назад";
    backEl.href = `/files${path.dirname(req.path)}`;

    filesEl.append(homeEl, backEl);

    if (!filesInDir.length) {
      const emptyEl = document.createElement("div");
      emptyEl.className = "empty";
      emptyEl.textContent = "Папка пуста";
      filesEl.append(emptyEl);
    }

    for (const file of filesInDir) {
      const encodedFile = file.replaceAll(" ", "+");
      const fileEl = document.createElement("a");
      fileEl.href = `/files${path.join(req.path, encodedFile)}`;
      fileEl.textContent = file.replaceAll("+", " ");

      const isDir = fs.statSync(path.join(filePath, encodedFile)).isDirectory();
      fileEl.className = isDir ? "item dir" : "item file";

      const filesRowEl = document.createElement("div");
      filesRowEl.className = "files-row";

      const itemEditEl = document.createElement("span");
      itemEditEl.textContent = "🖊️";
      itemEditEl.className = "item-edit";

      const itemDeleteEl = document.createElement("span");
      itemDeleteEl.textContent = "❌";
      itemDeleteEl.className = "item-delete";

      filesRowEl.append(fileEl, itemEditEl, itemDeleteEl);
      filesEl.append(filesRowEl);
    }

    return res.send(document.documentElement.outerHTML);
  } else if (videoExtensions.has(path.extname(filePath))) {
    const fileStream = fs.createReadStream(filePath);
    const fileStat = fs.statSync(filePath);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader(
      "Content-Range",
      `bytes 0-${fileStat.size - 1}/${fileStat.size}`
    );
    res.setHeader("Content-Length", fileStat.size);
    fileStream.pipe(res);
  } else {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return res.send(fileContent);
  }
});

app.post("/api/create-folder", (req, res) => {
  const folderPath = path.join(__dirname, req.body.folderPath);
  const newFolderName = req.body.newFolderName;

  if (!newFolderName) {
    return res.status(400).send("Имя папки не указано");
  }

  const newFolderPath = path.join(folderPath, newFolderName);

  try {
    fs.mkdirSync(newFolderPath);
    console.log(`Папка создана: ${newFolderPath}`);
    return res.status(200).send("Папка успешно создана");
  } catch (error) {
    console.error(`Ошибка при создании папки: ${error.message}`);
    return res.status(500).send("Внутренняя ошибка сервера");
  }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  return res.status(200).send("Файл успешно загружен");
});

app.post("/api/delete", (req, res) => {
  const filePath = path.join(__dirname, req.body.filePath);

  try {
    if (fs.statSync(filePath).isDirectory()) {
      fs.rmdirSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }

    console.log(`Файл или папка удалены: ${filePath}`);
    return res.status(200).send("Файл или папка успешно удалены");
  } catch (error) {
    console.error(`Ошибка при удалении файла или папки: ${error.message}`);
    return res.status(500).send("Внутренняя ошибка сервера");
  }
});

app.post("/api/update", (req, res) => {
  const filePath = path.join(__dirname, req.body.filePath);
  const newName = req.body.newName;

  try {
    const newPath = path.join(path.dirname(filePath), newName.replaceAll(" ", "_"));
    fs.renameSync(filePath, newPath);
    
    console.log(`Файл или папка обновлены: ${newPath}`);
    return res.status(200).send("Файл или папка успешно обновлены");
  } catch (error) {
    console.error(`Ошибка при обновлении файла или папки: ${error.message}`);
    return res.status(500).send("Внутренняя ошибка сервера");
  }
});

const port = 3001;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
