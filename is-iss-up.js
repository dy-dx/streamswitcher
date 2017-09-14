#!/usr/bin/env node

const { exec } = require('child_process');

const reference = {
  black: [8, 0, 31],
  blue: [2, 4, 222],
  ok: [73, 10, 72]
};

const tolerance = 30;

function rgbDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
}

function isBlackOrBlue(rgb) {
  const isBlack = rgbDistance(rgb, reference.black) < tolerance;
  const isBlue = rgbDistance(rgb, reference.blue) < tolerance;
  return isBlack || isBlue;
}

const childProcess = exec(
  [
    'ffmpeg -y -i',
    'http://iphone-streaming.ustream.tv/uhls/9408562/streams/live/iphone/playlist.m3u8',
    '-an -f image2 -vframes 1 -',
    '|',
    'convert - -scale 1x1\! -format "%[pixel:s]" info:-'
  ].join(' '),
  {
    timeout: 5000
  },
  function (error, stdout, stderr) {
    if (error) {
      console.error(error);
      process.exitCode = 1;
      return;
    }

    const rgb = stdout.match(/\d+/g).map(function (s) { return parseInt(s, 10); });
    if (isBlackOrBlue(rgb)) {
      process.exitCode = 1;
    }
  }
);
