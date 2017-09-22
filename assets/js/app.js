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
import 'phoenix_html';
import debounce from 'debounce';

// Import local files
//
// Local files can be imported directly using relative
// paths "./socket" or full ones "web/static/js/socket".

// import socket from "./socket"

import { play, setDimensions } from './player';

window.onresize = debounce(function onWindowResize() {
  setDimensions(document.body.clientWidth, document.body.clientHeight);
}, 200);

function pollSources() {
  fetch('./api/sources')
  .then(
    function(response) {
      if (response.status !== 200) {
        console.error(response.status);
        return;
      }

      response.json().then(function(data) {
        const liveSources = data.length && data.filter((s) => s.is_up) || [];
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

try {
  loadOrbitData();
} catch (e) {
  console.error(e);
}
