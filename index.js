"use strict";

const moment = require("moment"); // require

const UPDATE_PERIOD_MS = 1000;

function getEndDatesFromArgs() {
  if (process.argv.length < 3) {
    throw new Error("Error: none args passed!");
  }

  const currentDate = moment();

  return process.argv.slice(2).map((element) => {
    //[мин-]час-день-месяц-год
    let date = moment(element, "mm-HH-DD-MM-YYYY", true);
    if (!date.isValid()) {
      date = moment(element, "HH-DD-MM-YYYY", true);
    }

    if (!date.isValid()) {
      throw new Error(`Error: ${element} is bad formatted`);
    }

    const dateIsInFuture = date.isAfter(currentDate);

    if (!dateIsInFuture) {
      throw new Error(`Error: ${element} date is in the past`);
    }

    return date;
  });
}

function handleTimer(endTime, index) {
  const currentDate = moment();
  const duration = moment.duration(
    endTime.diff(currentDate, "seconds"),
    "seconds"
  );
  const asSeconds = duration.asSeconds();

  if (asSeconds <= 0) {
    console.log(`${index + 1}: countdown is over`);
    return 0;
  }

  const years = duration.years();
  const months = duration.months();
  const days = duration.days();
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  let msg = "";
  if (years) {
    msg += `${years}y `;
  }
  if (months || msg) {
    msg += `${months}M `;
  }
  if (days || msg) {
    msg += `${days}d `;
  }
  if (hours || msg) {
    msg += `${hours}h `;
  }
  if (minutes || msg) {
    msg += `${minutes}m `;
  }
  msg += `${seconds}s `;
  console.log(`${index + 1}: ${msg}`);
  return 1;
}

function run() {
  const endTimes = getEndDatesFromArgs();
  const timerId = setInterval(() => {
    console.clear();
    console.log("#  remaining time");
    console.log("-----------------");
    const aliveTimers = endTimes.reduce((counter, endTime, index)=>{
      return counter + handleTimer(endTime, index);
    }, 0);
    if (aliveTimers === 0) {
      clearInterval(timerId);
    }
  }, UPDATE_PERIOD_MS);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
