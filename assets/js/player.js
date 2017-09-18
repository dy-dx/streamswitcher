const options = {
  width: document.body.clientWidth,
  height: document.body.clientHeight,
  autoplay: true,
  controls: false,
  preload: 'auto'
};
const player = videojs('player', options, function onPlayerReady() {
  this.play();

  // this.on('ended', function() {
  //   videojs.log('ended');
  // });
});

export default player;
