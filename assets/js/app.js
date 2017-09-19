// Brunch automatically concatenates all files in your
// watched paths. Those paths can be configured at
// config.paths.watched in "brunch-config.js".
//
// However, those files will only be executed if
// explicitly imported. The only exception are files
// in vendor, which are never wrapped in imports and
// therefore are always executed.

// Import dependencies
//
// If you no longer want to use a dependency, remember
// to also remove its path from "config.paths.watched".
import "phoenix_html"

// Import local files
//
// Local files can be imported directly using relative
// paths "./socket" or full ones "web/static/js/socket".

// import socket from "./socket"

import player from "./player"

// todo: debounce
window.onresize = function onWindowResize() {
  player.width(document.body.clientWidth);
  player.height(document.body.clientHeight);
}

function play(source) {
  player.ready(function onPlayerReady() {
    if (source.src === player.src()) {
      return;
    }
    this.src(source);
  });
}


function pollSources() {
  fetch('./api/sources')
  .then(
    function(response) {
      if (response.status !== 200) {
        console.error(response.status);
        return;
      }

      response.json().then(function(data) {
        const liveSources = data.length && data.filter((s) => s.status) || [];
        if (liveSources.length) {
          play(liveSources[0]);
        }
      });
    }
  )
  .catch(console.error);
}

pollSources();
setInterval(pollSources, 5000);
