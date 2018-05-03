// API Key for MapboxGL. Get one here:
// https://www.mapbox.com/studio/account/tokens/
const key = 'pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg';


// Options for map
const options = {
	lat: 43.456366,
	lng: 11.787152,
	zoom: 5,
	style: 'mapbox://styles/mikima/cjfy1ltb45xo32spj8vpry2y3',
	pitch: 0,
};

let w,h;

// Create an instance of MapboxGL
const mappa = new Mappa('MapboxGL', key);
let myMap;

let canvas;
// datasets
let fullData, province;

//which layers
var show_TX30 = true;
var show_PRCPTOT = true;
var show_PR95PERC = false;
var show_lens = false;
var lens_size = 100;

// single layers
var l1, l2, l3

//max values, pre-calculated
var maxValues = {
	'TX30': 74,
	'PRCPTOT': -410,
	'PR95PERC': 88
}

function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
	province = loadJSON('assets/contorniProvince.json')
}

function setup() {
	w = 1920;
	h = 1080;
	canvas = createCanvas(w,h);
	// Create a tile map and overlay the canvas on top.
	myMap = mappa.tileMap(options);
	myMap.overlay(canvas);
	//add function to map zoom
	myMap.onChange(updateLayers);
}

// The draw loop is fully functional but we are not using it for now.
function draw() {
	//drawDancingPoints()
}

function updateLayers() {
	clear();
	blendMode(MULTIPLY);

	//calculate the crop area
	var croparea = createGraphics(windowWidth, windowHeight);
	croparea.pixelDensity(1);
	croparea.background(255);
	croparea.fill(0);
	croparea.noStroke();
	croparea.ellipseMode(CENTER);
	croparea.ellipse(mouseX, mouseY, lens_size);

	//image(croparea,0,0);


	if (show_TX30) {
		l1 = singleLayer('2071-2100', 'TX30', 'RCP85', '#ff0086');
		console.log(l1)
		var masked = pgMask(l1,croparea);
		image(masked, 0, 0,w,h);
	}

	if (show_PR95PERC) {
		l2 = singleLayer('2071-2100', 'PR95PERC', 'RCP85', '#f9ff00');

		var masked = pgMask(l2,croparea);
		image(masked, 0, 0,w,h);
	}

	if (show_PRCPTOT) {
		l3 = singleLayer('2071-2100', 'PRCPTOT', 'RCP85', '#00fff8');

		var masked = pgMask(l3,croparea);
		image(masked, 0, 0,w,h);
	}

	image(renderProvinces(),0,0,w,h);
}

function mouseMoved() {
	updateLayers();
}

function mouseClicked() {
	updateLayers()
	show_lens = true;
}

function singleLayer(_year, _variable, _scenario, _color) {

	//Create a temporary layer
	var layer = createGraphics(w, h);
	layer.pixelDensity(1);

	//load dataset
	var data = fullData.values

	//define style
	layer.fill(_color)
	layer.noStroke();

	//test un po' stupidino
	var p1 = myMap.latLngToPixel(data[0].lat, data[0].lon);
	var p2 = myMap.latLngToPixel(data[1].lat, data[1].lon);
	var distance = (p1.x - p2.x) / 5.55; //formula magica, ottini distanza tra punti
	//max value
	var maxVal = Math.sqrt(Math.abs(maxValues[_variable]));
	//console.log(maxValues[_variable])

	for (var i in data) {

		let item = data[i];
		const latitude = item.lat
		const longitude = item.lon

		// Transform lat/lng to pixel position
		const pos = myMap.latLngToPixel(latitude, longitude);

		// Get the variables
		let size = Math.sqrt(Math.abs(item[_year][_variable][_scenario]));
		size = map(size, 0, maxVal, 0, distance);
		//draw the ellpise
		layer.ellipse(pos.x, pos.y, size, size);
	}
	return layer;
}

function renderProvinces() {
	// for (var i = 0; i < province.polygons.length; i++) {

	// 	console.log(province.polygons[i]);
	// 	beginShape();
	// 	noFill();
	// 	stroke(0);
	// 	strokeWeight(1);
	// 	for (var j = 0; j < province.polygons[i][0].length; j++) {
	// 		var pos = myMap.latLngToPixel(province.polygons[i][0][j][1], province.polygons[i][0][j][0]);
	// 		vertex(pos.x, pos.y);
	// 	}
	// 	endShape();
	// }

	var layer = createGraphics(w, h);
	layer.pixelDensity(1);

	var features = province.features;
	province.features.forEach(function(feature) {

		//draw polygons
		var coords = feature.geometry.coordinates;
		for (var i = 0; i < coords.length; i++) {

			layer.beginShape();
			layer.noFill()
			layer.stroke('red');
			// Iterate among points
			// For some reasons, in multi-polygons points are nested in the first item of the array.
			// I imagine it is something related to polygons inner/outer contours.

			var points = feature.geometry.type == 'MultiPolygon' ? coords[i][0] : coords[i];

			for (var j = 0; j < points.length; j++) {
				//console.log(coords[i][j]);

				const latitude = points[j][1]
				const longitude = points[j][0]

				// Transform lat/lng to pixel position
				const pos = myMap.latLngToPixel(latitude, longitude);
				layer.vertex(pos.x, pos.y);
			}
			//close path
			layer.endShape();
		}
	})

	return layer;
}

function pgMask(_content,_mask){
  //Create the mask as image
  var img = createImage(_mask.width,_mask.height);
  img.copy(_mask, 0, 0, _mask.width, _mask.height, 0, 0, _mask.width, _mask.height);
  //load pixels
  img.loadPixels();
  for (var i = 0; i < img.pixels.length; i += 4) {
    // 0 red, 1 green, 2 blue, 3 alpha
    // Assuming that the mask image is in grayscale,
    // the red channel is used for the alpha mask.
    // the color is set to black (rgb => 0) and the
    // alpha is set according to the pixel brightness.
    var v = img.pixels[i];
    img.pixels[i] = 0;
    img.pixels[i+1] = 0;
    img.pixels[i+2] = 0;
    img.pixels[i+3] = v;
  }
  img.updatePixels();
  
  //convert _content from pg to image
  var contentImg = createImage(_content.width,_content.height);
  contentImg.copy(_content, 0, 0, _content.width, _content.height, 0, 0, _content.width, _content.height);
  // create the mask
  contentImg.mask(img)
  // return the masked image
  return contentImg;
}