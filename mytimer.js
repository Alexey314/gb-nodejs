"use strict";

const moment = require("moment");

class MyTimer {
  endTime = null;
  endTimeArg = null;
  id = null;
  emitter = null;
  message = "";
  done = false;

  constructor({ id, endTimeArg, emitter }) {
    this.endTimeArg = endTimeArg;
    this.id = id;
    this.emitter = emitter;

    //[мин-]час-день-месяц-год
    let date = moment(endTimeArg, "mm-HH-DD-MM-YYYY", true);
    if (!date.isValid()) {
      date = moment(endTimeArg, "HH-DD-MM-YYYY", true);
    }

    if (!date.isValid()) {
      throw new Error(`Error: ${endTimeArg} is bad formatted`);
    }

    const currentDate = moment();

    const dateIsInFuture = date.isAfter(currentDate);

    if (!dateIsInFuture) {
      throw new Error(`Error: ${endTimeArg} date is in the past`);
    }

    this.endTime = date;

    emitter.on("update", this.handleUpdate);
  }

  handleUpdate = () => {
    // console.log(`${this.id}: ${this.endTimeArg}`);
    const currentDate = moment();
    const duration = moment.duration(
      this.endTime.diff(currentDate, "seconds"),
      "seconds"
    );
    const asSeconds = duration.asSeconds();

    if (asSeconds <= 0) {
      this.message = `${this.id}: countdown is over`;
      this.emitter.off("update", this.handleUpdate);
      this.done = true;
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
    this.message = `${this.id + 1}: ${msg}`;
  };
}

module.exports = MyTimer;
