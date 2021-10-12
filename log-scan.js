const fs = require("fs");
const yargs = require("yargs");
const inquirer = require("inquirer");
const path = require("path");
const { isArray } = require("util");

const options = yargs
  .usage("Usage: -d <path/to/folder>")
  .option("d", {
    alias: "dir",
    describe: "Path to folder",
    type: "string",
    demandOption: true,
  })
  .option("s", {
    alias: "substring",
    describe: "Substring to search for",
    type: "string",
    demandOption: false,
  })
  .option("r", {
    alias: "regexp",
    describe: "Regexp to search for",
    type: "string",
    demandOption: false,
  }).argv;

async function promtUserSelectFile(path) {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "targetPath",
        message: "Select file to process",
        choices: fs.readdirSync(path),
      },
    ])
    .then((answer) => {
      return Promise.resolve(answer.targetPath);
    });
}

function toOptionArray(option) {
  if (Array.isArray(option)) {
    return option;
  } else if (option) {
    return [option];
  }
}

function toPrintableArray(array) {
  return array.map((val) => `'${val}'`).join(", ");
}

async function run() {
  let userPath = options.dir;
  while (fs.lstatSync(userPath).isDirectory()) {
    const dirEntry = await promtUserSelectFile(userPath);
    userPath = path.join(userPath, dirEntry);
  }

  const substrings = options.substring ? toOptionArray(options.substring) : [];
  const regexps = options.regexp
    ? toOptionArray(options.regexp).map((val) => new RegExp(val))
    : [];

  console.log(`Selected file: ${userPath}`);
  if (substrings.length) {
    console.log(`Substrings to search for: ${toPrintableArray(substrings)}`);
  }
  if (regexps.length) {
    console.log(
      `Patterns to search for: ${toPrintableArray(
        regexps.map((val) => val.toString())
      )}`
    );
  }

  const searchables = [...substrings, ...regexps];

  if (searchables.length) {
    scanLog(userPath, ...searchables);
  } else {
    throw new Error("At least one -s or -r arg must be passed");
  }

  return Promise.resolve("Done");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

function isRegexp(value) {
  return Object.prototype.toString.call(value) === "[object RegExp]";
}

function scanLog(logPath, ...searchValues) {
  const readStream = fs.createReadStream(logPath, "utf-8");
  const onWriteError = (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  };
  const filters = searchValues.map((value) => {
    // replace characters not allowed in filenames for *NIX
    const filenamePrefix = (isRegexp(value) ? value.toString() : value).replace(
      /(\\|\/|\x00)/g,
      "_"
    );
    const writeFilename = `./${filenamePrefix}_requests.log`;
    const writeStream = fs.createWriteStream(writeFilename, "utf-8");
    writeStream.on("error", onWriteError);
    writeStream.on("finish", () => console.log(`${writeFilename} written`));
    return {
      value,
      writeStream,
    };
  });

  let lastPartialLine = "";
  readStream.on("data", (chunk) => {
    const continuousChunk = lastPartialLine + chunk;
    const lines = continuousChunk.split(/\r?\n/);
    lastPartialLine = lines[lines.length - 1];
    const validLineCount = lines.length === 1 ? 1 : lines.length - 1;
    for (let i = 0; i < validLineCount; i++) {
      const line = lines[i];
      for (let filter of filters) {
        let lineMatch = false;
        if (isRegexp(filter.value)) {
          lineMatch = filter.value.test(line);
        } else {
          lineMatch = line.includes(filter.value);
        }

        if (lineMatch) {
          filter.writeStream.write(line);
          filter.writeStream.write("\n");
        }
      }
    }
  });

  readStream.on("open", () => {
    console.log(`Input file ${logPath} opened`);
  });

  readStream.on("error", (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  });

  readStream.on("end", () => {
    for (let filter of filters) {
      filter.writeStream.end();
    }
  });
}
