"use strict";

const EventEmitter = require("events");
const MyTimer = require("./mytimer");

const UPDATE_PERIOD_MS = 1000;
const emitter = new EventEmitter();

async function run() {
  if (process.argv.length < 3) {
    throw new Error("Error: none args passed!");
  }

  const timers = process.argv.slice(2).map((arg, index) => {
    const endTimeArg = arg;
    const id = index;
    return new MyTimer({ id, endTimeArg, emitter });
  });

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (emitter.listenerCount("update") === 0) {
        clearInterval(intervalId);
        resolve();
      }
      emitter.emit("update");
      process.nextTick(() => {
        console.clear();
        timers.forEach((timer) => console.log(timer.message));
      });
    }, UPDATE_PERIOD_MS);
  });
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
