// API Key for MapboxGL. Get one here:
// https://www.mapbox.com/studio/account/tokens/
const key = 'pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg';

// Options for map
const options = {
  lat: 43.456366,
  lng: 11.787152,
  zoom: 2,
  style: 'mapbox://styles/mikima/cjfy1ltb45xo32spj8vpry2y3',
  //style: 'mapbox://styles/mapbox/traffic-night-v2',
  pitch: 0,
};

// Create an instance of MapboxGL
const mappa = new Mappa('MapboxGL', key);
let myMap;

let canvas;
let meteorites;
let data_tx30;

function preload() {
  //data_tx30 = loadTable('assets/TX30.csv', 'csv', 'header');
  data_tx30 = loadJSON('assets/climatechange_data.json');
}

function setup() {
  canvas = createCanvas(1000, 700)
  //.parent('canvasContainer');

  // Create a tile map and overlay the canvas on top.
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);

  // Load the data
  //console.log(data_tx30);

  myMap.onChange(drawPoints);

}

// The draw loop is fully functional but we are not using it for now.
function draw() {
  //drawDancingPoints()
}

function drawPoints() {
  // Clear the canvas
  clear();
  console.log('disegno!');

  var data = data_tx30.values
  console.log(data);

  //fill(random(255),random(255),random(255))
  fill('red')
  noStroke();

  

  let maxSize = map(myMap.zoom(), 10, 5, 290, 10)/2

  console.log(myMap.zoom(), maxSize)

  for (var i in data) {
    //console.log(data[i]);
    // Get the lat/lng of each point ['2100_RCP85']
    let item = data[i];

    const latitude = item.lat
    const longitude = item.lon

    // Transform lat/lng to pixel position
    const pos = myMap.latLngToPixel(latitude, longitude);
    //console.log(latitude, longitude);
    // Get the size of the meteorite and map it. 60000000 is the mass of the largest
    // meteorite (https://en.wikipedia.org/wiki/Hoba_meteorite)
    // let size = Math.sqrt(item['2071-2100']['TX30']['RCP85']);
    // size = map(size, 0, 8.7, 0, 2) + myMap.zoom();
    size = 1;
    ellipse(pos.x, pos.y, size, size);

  }
}

function drawDancingPoints() {
  var data = data_tx30.values;


  clear()
  fill('red')
  noStroke();

  for (var i in data) {
    //console.log(data[i]);
    // Get the lat/lng of each point ['2100_RCP85']
    let item = data[i];

    const latitude = item.lat
    const longitude = item.lon



    // Transform lat/lng to pixel position
    const pos = myMap.latLngToPixel(latitude, longitude);

    let xrand = noise(frameCount / 100 + pos.x / 100) * 5;
    let yrand = noise(frameCount / 100 + pos.y / 100) * 5;
    //console.log(latitude, longitude);
    // Get the size of the meteorite and map it. 60000000 is the mass of the largest
    // meteorite (https://en.wikipedia.org/wiki/Hoba_meteorite)
    let size = Math.sqrt(item['2071-2100']['TX30']['RCP85']);
    //size = map(size, 0, 8.7, 0, 2) + myMap.zoom();
    
    ellipse(pos.x + xrand, pos.y + yrand, size, size);

  }
}