"use strict";

const net = require("net");
const JsonSocket = require("json-socket");
const fs = require("fs");
const path = require("path");

const port = 5555;
const server = net.createServer();
server.listen(port);
console.log(`Listen to port ${port}`);
server.on("connection", function (socket) {
  const jsonSocket = new JsonSocket(socket);

  jsonSocket.on("message", function (message) {
    try {
      // console.log(`Request: ${JSON.stringify(message)}`);
      let reply;
      switch (message.command) {
        case "GET_DIR_CONTENT_LIST":
          reply = createDirContentListReply(message.payload.path);
          break;
        case "GET_FILE_CONTENT":
          reply = createFileContentReply(message.payload.path);
          break;
        default:
          reply = createUnknownReply();
      }

      // console.log(`Reply: ${JSON.stringify(reply)}`);
      jsonSocket.sendMessage(reply);
    } catch (error) {
      console.log(error.toString());
    }
  });
});

function getDirContentList(dirPath) {
  return fs.readdirSync(dirPath).map((val) => ({
    fileName: String(val),
    isDir: fs.lstatSync(path.join(dirPath, val)).isDirectory(),
  }));
}

function createDirContentListReply(path) {
  return {
    reply: "DIR_CONTENT_LIST",
    payload: {
      path: String(path),
      list: getDirContentList(path),
    },
  };
}

function createFileContentReply(path) {
  return {
    reply: "FILE_CONTENT",
    payload: {
      path: String(path),
      data: fs.readFileSync(path, "utf-8"),
    },
  };
}

function createUnknownReply() {
  return {
    reply: "UNKNOWN_COMMAND",
  };
}
