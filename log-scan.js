const fs = require("fs");
const yargs = require("yargs");

const options = yargs
  .usage("Usage: -d <path/to/folder>")
  .option("d", {
    alias: "dir",
    describe: "Path to folder",
    type: "string",
    demandOption: true,
  }).argv;

console.log(`options=${JSON.stringify(options)}`);

function scanLog(logPath, ...searchValues) {
  const readStream = fs.createReadStream(logPath, "utf-8");
  const onWriteError = (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
  };
  const filters = [...searchValues].map((value) => {
    const writeFilename = `./${value}_requests.log`;
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
        if (line.includes(filter.value)) {
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

scanLog(...process.argv.slice(2));
