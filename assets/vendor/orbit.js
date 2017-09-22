var track;
var map2;
var lastDayNightOverlayUpdate = 0;
var isMiles = true;
var MILE_IN_KM = 1.609344;
var isLoadingOrbitData = false;
var handle;

var dict = {
  decimalPoint: ".",
  south: "South",
  east: "East",
  north: "North",
  west: "West",
  worldMapImage: "images/world_06_en.png"
};

function loadOrbitData() {
  if (isLoadingOrbitData) { return; }
  isLoadingOrbitData = true;

  var timestamp = new Date().getTime();
  var src = 'https://cors.io/?http://astroviewer-sat2a.appspot.com/orbit?var=orbit&t=' + timestamp;
  fetch(src)
  .then(function (response) {
    return response.text();
  })
  .then(function (scriptText) {
    isLoadingOrbitData = false;
    // executes "var orbit = {}" in this scope
    eval(scriptText);
    initialize(orbit);
  })
  .catch(function(e) {
    isLoadingOrbitData = false;
    console.error(e);
  });
}

function initialize(orbit) {
  var elem = document.querySelector(".iss-tracker");
  elem.classList.add("iss-tracker-loaded");
  track = orbit.orbitData;
  var serverTime = orbit.tRef;
  var clientTime = Math.round(new Date().getTime()/1000);
  var timeDiff = clientTime - serverTime;

  var currTime = serverTime;

  var state = getSatelliteState(currTime);
  var satLon = state.lon;

  ////////////////////// neu
  map2 = new WorldMap(document.getElementById("map_canvas"), new GeoPoint(satLon, 0));
  map2.dayNightBoundary = getDayNightBoundary(currTime*1000);
  addOrbit();
  //////////////////////

  clearInterval(handle);

  function onUpdate() {
    var currentTime = Math.round(new Date().getTime()/1000) - timeDiff;
    update(currentTime);
  }
  onUpdate();
  handle = window.setInterval(onUpdate, 1000);
}

function addOrbit() {
  var wasSunlit = track[0].s;
  var trackSegmentCoords = new Array();

  for (var i=0; i<track.length; i++) {
    trackSegmentCoords.push(new GeoPoint(track[i].ln, track[i].lt));
    if (i == 0)
      continue;

    if (track[i].s ^ wasSunlit) {    // change of sunlit state
      var lastGroundPoint = trackSegmentCoords.pop();

      addTrackSegment(trackSegmentCoords, wasSunlit);

      trackSegmentCoords = new Array();
      trackSegmentCoords.push(lastGroundPoint);
    }

    wasSunlit = track[i].s;
  }

  addTrackSegment(trackSegmentCoords, wasSunlit);
}


function addTrackSegment(coordsArray, sunlit) {
  var sunlitColor = "#ff9999";
  var darkColor   = "#6666cc";
  var segmentColor = sunlit ? sunlitColor : darkColor;
  map2.polylines.push(new Polyline(coordsArray, segmentColor, 2));
}


function update(time) {   // time in seconds since Jan. 01, 1970 UTC
  var state = getSatelliteState(time);
  if (!state) { return; }
  updateMaps(state.time, state.lon, state.lat);
  updateCockpit(state.time, state.lon, state.lat, state.alt, state.speed);
}


function updateMaps(time, lon, lat) {   // time in seconds since Jan. 01, 1970 UTC
  var gndPt = new GeoPoint(lon, lat);
  var ctrPt = new GeoPoint(lon, 0);

  map2.center = ctrPt;
  map2.crosshairPosition = gndPt;
  if (Math.abs(time - lastDayNightOverlayUpdate) > 60) {
    map2.dayNightBoundary = getDayNightBoundary(time*1000);
    lastDayNightOverlayUpdate = time;
  }
  map2.update();
}


function updateCockpit(time, lon, lat, alt, speed) {   // time in seconds since Jan. 01, 1970 UTC
  var gptField = document.getElementById("gpt");
  gptField.innerHTML = getCoordinatesString(lon, lat);
  var timeField = document.getElementById("time");
  timeField.innerHTML = getUTCTimeString(time);
  var altField = document.getElementById("alt");
  var speedField = document.getElementById("speed");
  if (isMiles) {
    altField.innerHTML = Math.round(alt / MILE_IN_KM) + " miles";
    speedField.innerHTML = formatDecimal(speed / MILE_IN_KM, 3) + " miles / s<br />" + Math.round(speed * 3600.0 / MILE_IN_KM) + " mph";
  } else {
    altField.innerHTML = Math.round(alt) + " km";
    speedField.innerHTML = Math.round(speed * 1000.0) + " m/s<br />" + Math.round(speed * 3600.0) + " km/h";
  }
}


function getCoordinatesString(lon, lat) {
  var lonString = formatDecimal(Math.abs(lon), 2) + "\u00b0 " + (lon < 0 ? dict.west  : dict.east);
  var latString = formatDecimal(Math.abs(lat), 2) + "\u00b0 " + (lat < 0 ? dict.south : dict.north);
  return latString + "<br />" + lonString;
}


function formatDecimal(x, digits) {   // wird auch in prediction.js verwendet
  var decPoint = dict.decimalPoint;
  var f = Math.pow(10, digits);
  var g = "" + parseInt(x*f + (0.5 * (x>0 ? 1 : -1)));
  if (digits == 0)
    return g;
  if (x < 0)
    g = g.substring(1, g.length);
  while (g.length < digits+1)
    g = "0" + g;
  g = g.substring(0, g.length - digits) + decPoint + g.substring(g.length - digits, g.length);
  if (x < 0)
    g = "-" + g;
  return g;
}


function getUTCTimeString(time) {   // time in seconds since Jan. 01, 1970 UTC
  var t = new Date(time*1000);
  var utcHour = t.getUTCHours();
  if (utcHour < 10)
    utcHour = "0" + utcHour;
  var utcMinute = t.getUTCMinutes();
  if (utcMinute < 10)
    utcMinute = "0" + utcMinute;
  var utcSecond = t.getUTCSeconds();
  if (utcSecond < 10)
    utcSecond = "0" + utcSecond;
  return utcHour + ":" + utcMinute + ":" + utcSecond + " UTC";
}


function getSatelliteState(time) {   // time in seconds since Jan. 01, 1970 UTC
  if ( (time < track[0].t) || (time > track[track.length-1].t) ) {
    loadOrbitData();
    return null;
  }

  try {
    var idx = getIndex(time);
    var state1 = track[idx];
    var state2 = track[idx+1];
    var factor = (time - state1.t) / (state2.t - state1.t);
    var lon    = state1.ln;
    if (Math.abs(state2.ln - state1.ln) > 180)
      lon += (state2.ln - state1.ln + 360) * factor;
    else
      lon += (state2.ln - state1.ln) * factor;
    while (lon > 180)
      lon -= 360;
    while (lon < -180)
      lon += 360;
    var lat   = state1.lt + (state2.lt - state1.lt) * factor;
    var alt   = state1.h + (state2.h - state1.h) * factor;
    var speed = state1.v + (state2.v - state1.v) * factor;
    return { time: time, lon: lon, lat: lat, alt: alt, speed: speed };
  }
  catch (ex) {
    loadOrbitData();
    return null;
  }
}


function getIndex(time) {   // time in seconds since Jan. 01, 1970 UTC
  var i = 0;
  while ( (time >= track[i].t) && (i < track.length) )
    i++;
  return i - 1;
}


function WorldMap(canvas, initialCenter) {
  var thisMap = this;

  this.canvas = canvas;
  this.center = initialCenter;

  this.img = new Image();
  this.img.src = dict["worldMapImage"];
  this.img.onload = function (e) {
    thisMap.update();
  }

  this.dayNightBoundary = null;

  this.polylines = new Array();

  this.crosshairPosition = null;

  this.getXY = function (geoPoint) {
    var scaleFactor = this.img.width / 360.0;   // pixels per degree
    var lon2 = geoPoint.lon - this.center.lon;
    var xx = this.img.width * 0.5 + lon2 * scaleFactor;
    var x = xx + (this.canvas.width - this.img.width) * 0.5;
    var lat2 = geoPoint.lat - this.center.lat;
    var yy = this.img.height * 0.5 - lat2 * scaleFactor;
    var y = yy + (this.canvas.height - this.img.height) * 0.5;
    return new ImagePoint(x, y);
  }

  this.update = function () {
    var W = this.img.width;
    var mapOrigin = this.getXY(new GeoPoint(-180, 90));
    var xMap = mapOrigin.x;
    var yMap = mapOrigin.y;
    var context = this.canvas.getContext('2d');
    context.drawImage(this.img, xMap, yMap);
    if (xMap > 0) {
      context.drawImage(this.img, xMap - this.img.width, yMap);
    }
    else {
      context.drawImage(this.img, xMap + this.img.width, yMap);
    }

    function drawShadow(offsetX, offsetY) {
      context.beginPath();
      for (var i=0; i<thisMap.dayNightBoundary.length; i++) {
        var pt = thisMap.getXY(thisMap.dayNightBoundary[i]);
        var x = pt.x;
        var y = pt.y;
        if (i == 0)
          context.moveTo(x + offsetX, y + offsetY);
        else
          context.lineTo(x + offsetX, y + offsetY);
      }
      context.closePath();
      context.lineWidth = 1;
      context.fillStyle = "rgba(128, 128, 128, 0.4)";
      context.fill();
    }

    if (this.dayNightBoundary != null) {
      drawShadow(0, 0);
      if (xMap > 0)
        drawShadow(-W, 0);
      else
        drawShadow(W, 0);
    }

    this.polylines.forEach(function (polyline, j, polylines) {

      function drawPolyline(offsetX, offsetY) {
        context.beginPath();
        var xOld;
        var yOld;
        for (var i=0; i<polyline.coordsArray.length; i++) {
          var pt = thisMap.getXY(polyline.coordsArray[i]);
          var x = pt.x + offsetX;
          var y = pt.y + offsetY;
          if (i == 0)
            context.moveTo(x, y);
          else {
            if (Math.abs(x - xOld) > W * 0.5) {
              if (x < xOld) {
                context.lineTo(x + W, y);
                context.moveTo(xOld - W, yOld);
              }
              else {
                context.lineTo(x - W, y);
                context.moveTo(xOld + W, yOld);
              }
            }
            context.lineTo(x, y);
          }
          xOld = x;
          yOld = y;
        }
        context.lineWidth = polyline.lineWidth;
        context.strokeStyle = polyline.color;
        context.stroke();
      }

      drawPolyline(0, 0);
      if (xMap > 0)
        drawPolyline(-W, 0);
      else
        drawPolyline(W, 0);
    });

    if (this.crosshairPosition) {
      var S = 10;
      chPt = this.getXY(this.crosshairPosition);
      var x = chPt.x;
      var y = chPt.y;
      context.beginPath();
      context.moveTo(x+S, y);
      context.lineTo(x-S, y);
      context.moveTo(x, y+S);
      context.lineTo(x, y-S);
      context.lineWidth = 3;
      context.strokeStyle = 'white';
      context.stroke();
      context.lineWidth = 1;
      context.strokeStyle = 'black';
      context.stroke();
    }
  }
}

function GeoPoint(lon, lat) {
  this.lon = lon;
  while (this.lon > 180)
    this.lon -= 360;
  while (this.lon < -180)
    this.lon += 360;

  if (lat > 90)
    this.lat = 90;
  else
    if (lat < -90)
      this.lat = -90;
    else
      this.lat = lat;
}

function ImagePoint(x, y) {
  this.x = x;
  this.y = y;
}

function Polyline(coordsArray, color, lineWidth) {
  this.coordsArray = coordsArray;
  this.color = color;
  this.lineWidth = lineWidth;
}


/////////////////// former daynight overlay
var J2000_0 = 946728000000;
var RAD_PER_DEG = Math.PI / 180.0;
var DOUBLE_PI = 2.0 * Math.PI;
var MILLISECONDS_PER_CENTURY = 1000 * 3600 * 24 * 36525.0;

function getDayNightBoundary(time) {
  var sunPos = getEquatorialSunPosition(time);
  var sunGndPt = getSunGroundPoint(time, sunPos);

  var sunLon = toRadians(sunGndPt.lon);
  var sunLat = toRadians(sunGndPt.lat);
  var boundary = new Array();
  for (var lonDeg=-180; lonDeg<=180; lonDeg+=5) {
    var lon = toRadians(lonDeg);
    var tanLat = -Math.cos(sunLon - lon) / Math.tan(sunLat);
    var lat = Math.atan(tanLat);
    var latDeg = toDegrees(lat);
    var pt = new GeoPoint(lonDeg, latDeg);
    boundary.push(pt);
  }
  var nearPoleLat = (sunLat < 0.0) ? 89.0 : -89.0;
  for (var lonDeg=180; lonDeg>=-180; lonDeg-=60) {
    var pt = new GeoPoint(lonDeg, nearPoleLat);
    boundary.push(pt);
  }
  return boundary;
}

function getEquatorialSunPosition(time) {
  var n = (time - J2000_0) / 86400000.0;
  var lDeg = 280.460 + 0.9856474*n;
  var gDeg = 357.528 + 0.9856003*n;
  var g = toRadians(gDeg);
  var lambdaDeg = lDeg + 1.915*Math.sin(g) + 0.020*Math.sin(2.0*g);
  var lambda = toRadians(lambdaDeg);

  var eDeg = 23.4393 - 3.563e-7*n;
  var e = toRadians(eDeg);

  var sinLambda = Math.sin(lambda);
  var rectAsc = Math.atan2(Math.cos(e) * sinLambda, Math.cos(lambda));
  var decl = Math.asin(Math.sin(e) * sinLambda);

  return { rectAsc: rectAsc, decl: decl };
}

function getSunGroundPoint(time, sunPos) {
  var declDeg = toDegrees(sunPos.decl);
  var lonDeg  = toDegrees(sunPos.rectAsc - getGMST(time));
  var gpt = new GeoPoint(lonDeg, declDeg);
  return gpt;
}

function getGMST0(time) {
  var tSinceJ2000_0 = time - J2000_0;
  var t = tSinceJ2000_0 / MILLISECONDS_PER_CENTURY;  // Julian centuries since J2000.0
  var gmst0Degrees = 100.46061837;
  gmst0Degrees += 36000.770053608 * t;
  gmst0Degrees += 3.87933e-4 * t*t;
  gmst0Degrees += t*t*t / 38710000.0;
  var gmst0Radians = toRadians(gmst0Degrees);
  return rev(gmst0Radians);
}

function getGMST(time) {
  var today0utc = new Date(time);
  today0utc.setUTCHours(0, 0, 0, 0);
  var utInMillis = time - today0utc.getTime();
  var ut = utInMillis / 3600000.0 / 12.0 * Math.PI;   // in radians
  return rev(getGMST0(time) + ut);
}

function toRadians(degrees) {
  return degrees * RAD_PER_DEG;
}

function toDegrees(radians) {
  return radians / RAD_PER_DEG;
}

function rev(angle) {
  return (angle - Math.floor(angle/DOUBLE_PI)*DOUBLE_PI);
}
