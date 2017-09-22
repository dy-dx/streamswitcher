const options = {
  width: document.body.clientWidth,
  height: document.body.clientHeight,
  autoplay: true,
  controls: false,
  preload: 'auto'
};

let player;

function createVideoElement(videoContainer, id) {
  const videoElem = document.createElement('video');
  videoElem.id = id;
  videoElem.classList.add('video-js');
  videoContainer.appendChild(videoElem);
}

function createPlayer() {
  createVideoElement(document.getElementById('player-container'), 'player');
  const player = videojs('player', options);
  player.disposable = false;
  return player;
}

function play(source) {
  if (source.src === player.src()) {
    return;
  }
  if (player.disposable) {
    // hopefully this fixes a memory leak
    player.dispose();
    player = createPlayer();
  } else {
    player.disposable = true;
  }

  player.ready(function onPlayerReady() {
    player.src(source);
  });
}

function setDimensions(width, height) {
  player.dimensions(width, height);
}

player = createPlayer();

export {
  play,
  setDimensions,
};
