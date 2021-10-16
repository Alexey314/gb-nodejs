"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");

const port = 5555;
const rootDir = "/";

http
  .createServer((request, response) => {
    // console.log(`request: ${request.url}`);
    const reqPath = request.url;
    let fullPath = path.join(rootDir, reqPath);
    try {
      let lstat = fs.lstatSync(fullPath);
      if (lstat.isSymbolicLink()) {
        fullPath = followSymlink(fullPath);
      }
      lstat = fs.lstatSync(fullPath);
      if (lstat.isDirectory()) {
        const fileList = fs.readdirSync(fullPath);
        response.setHeader("Content-Type", "text/html");
        response.end(
          constructDocument(
            fileList
              .map((val) => {
                const relDirPath = fullPath.slice(rootDir.length);
                // console.log(`relDirPath = ${relDirPath}`);
                const relFullPath = path.join(relDirPath, val);
                // console.log(`relFullPath = ${relFullPath}`);
                return `<a href=/${relFullPath}>${decodateFilename(
                  fullPath,
                  val
                )}</a>`;
              })
              .join("\n<br>\n") || "No data in this folder"
          )
        );
      } else if (lstat.isFile()) {
        const contentType = mime.contentType(path.extname(fullPath));
        // console.log(`contentType `,contentType);
        response.setHeader("Content-Type", contentType || "text/plain");
        const readStream = fs.createReadStream(fullPath, "utf-8");
        readStream.pipe(response);
      } else {
        response.setHeader("Content-Type", "text/html");
        response.end(constructDocument("Unsupported filesystem entry"));
      }
    } catch (error) {
      console.error(error.toString());
      response.statusCode = 404;
      response.end(`Path '${fullPath}' not exit!`);
    }
  })
  .listen(port, "localhost");

function constructDocument(bodyHtml) {
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>A Basic HTML5 Template</title>
  </head>
  <body>
    ${bodyHtml}
  </body>
  </html>`;
}

console.log(`Lesten to port ${port}`);

function decodateFilename(fullPath, filename) {
  const filePath = path.join(fullPath, filename);
  const lstat = fs.lstatSync(filePath);

  if (lstat.isDirectory()) {
    return `/${filename}`;
  } else if (lstat.isSymbolicLink()) {
    return `~${filename}`;
  } else {
    return `${filename}`;
  }
}

function followSymlink(path) {
  let realPath = path;
  do {
    realPath = fs.realpathSync(realPath);
  } while (fs.lstatSync(realPath).isSymbolicLink());
  return realPath;
}
