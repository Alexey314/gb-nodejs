#!/usr/bin/env node
"use strict";

const net = require("net");
const JsonSocket = require("json-socket");
const inquirer = require("inquirer");
const path = require("path");
const yargs = require("yargs");

const options = yargs
  .usage("Usage: -h <host name or address> -p <port> -d <initial folder>")
  .option("h", {
    alias: "host",
    describe: "Server name or address",
    type: "string",
    demandOption: true,
  })
  .option("p", {
    alias: "port",
    describe: "Server port",
    type: "string",
    demandOption: true,
  })
  .option("d", {
    alias: "directory",
    describe: "Initial folder on server",
    type: "string",
    demandOption: true,
  }).argv;

const port = options.port;
const host = options.host;
const initialPath = options.directory;

const jsonSocket = new JsonSocket(new net.Socket());
jsonSocket.connect(port, host);
jsonSocket.on("connect", async function () {
  let currentPath = initialPath;
  let currentPathIsDir = true;
  while (1) {
    console.clear();
    console.log(`Path: ${currentPath}`);
    try {
      if (currentPathIsDir) {
        jsonSocket.sendMessage(createGetDirContentListCommand(currentPath));
        const reply = await getReply(jsonSocket);
        // console.log(`Reply: ${JSON.stringify(reply)}`);
        const userFilename = await promtUserSelectFile(
          reply.payload.list.map((val) => val.fileName)
        );
        // console.log(`userFilename: ${JSON.stringify(userFilename)}`);
        const fileListItem = reply.payload.list.find(
          (val) => val.fileName === userFilename
        );
        // console.log(`fileEntry: ${JSON.stringify(fileEntry)}`);
        currentPath = path.join(currentPath, userFilename);
        currentPathIsDir = fileListItem.isDir;
        // console.log(`currentPath: ${currentPath}, isDir: ${currentPathIsDir}`);
      } else {
        jsonSocket.sendMessage(createGetFileContentCommand(currentPath));
        const reply = await getReply(jsonSocket);
        // console.log(`Reply: ${JSON.stringify(reply)}`);
        console.log("File content:");
        console.log(reply.payload.data);
        jsonSocket.end();
        process.exit(0);
      }
    } catch (error) {
      console.log(error.toString());
    }
  }
});

function createGetDirContentListCommand(dirPath) {
  return {
    command: "GET_DIR_CONTENT_LIST",
    payload: {
      path: String(dirPath),
    },
  };
}

function createGetFileContentCommand(filePath) {
  return {
    command: "GET_FILE_CONTENT",
    payload: {
      path: String(filePath),
    },
  };
}

async function getReply(jsonSocket) {
  return new Promise((resolve) => {
    const handler = (message) => {
      resolve(message);
      jsonSocket._socket.off("message", handler);
    };
    jsonSocket.on("message", handler);
  });
}

async function promtUserSelectFile(fileList) {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "targetPath",
        message: "Select file to view",
        choices: fileList,
      },
    ])
    .then((answer) => {
      return Promise.resolve(answer.targetPath);
    });
}
