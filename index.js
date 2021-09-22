"use strict";

const colors = require("colors/safe");

function reportErrAndExit(errMsg) {
  console.error(colors.red(errMsg));
  process.exit(1);
}

if (process.argv.length < 4) {
  reportErrAndExit("Required arguments not passed!");
}

const rngA = Number(process.argv[2]);
const rngB = Number(process.argv[3]);

if (Number.isNaN(rngA) || Number.isNaN(rngB)) {
  reportErrAndExit("Both arguments must be valid numbers");
}

if (rngA === rngB) {
  reportErrAndExit("Arguments must have different values");
}

const rngMin = Math.min(rngA, rngB);
const rngMax = Math.max(rngA, rngB);

function isPrime(num) {
  if (num <= 3) return num > 1;

  if (num % 2 === 0 || num % 3 === 0) return false;

  let count = 5;

  while (Math.pow(count, 2) <= num) {
    if (num % count === 0 || num % (count + 2) === 0) return false;

    count += 6;
  }

  return true;
}

const colorWrappers = [
  (msg) => colors.green(msg),
  (msg) => colors.yellow(msg),
  (msg) => colors.red(msg),
];

let primeCounter = 0;

for (let i = rngMin; i <= rngMax; i++) {
  if (isPrime(i)) {
    console.log(colorWrappers[primeCounter % 3](`${i}`));
    ++primeCounter;
  }
}

if (primeCounter === 0) {
  reportErrAndExit(`No prime numbers found in range ${rngMin} - ${rngMax}`);
}
