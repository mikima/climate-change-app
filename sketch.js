// API Key for MapboxGL. Get one here:
// https://www.mapbox.com/studio/account/tokens/
const key = 'pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg';


// Options for map
const options = {
	lat: 43.456366,
	lng: 11.787152,
	zoom: 5,
	style: 'mapbox://styles/mikima/cjfy1ltb45xo32spj8vpry2y3',
	//style: 'mapbox://styles/mapbox/traffic-night-v2',
	pitch: 0,
};

// Create an instance of MapboxGL
const mappa = new Mappa('MapboxGL', key);
let myMap;

let canvas;
let fullData

//which layers
var show_TX30 = false;
var show_PRCPTOT = true;
var show_PR95PERC = false;
var show_lens = false;
var lens_size = 100;

//max values, pre-calculated
var maxValues = {
	'TX30': 74,
	'PRCPTOT': -410,
	'PR95PERC': 88
}

function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
}

function setup() {
	canvas = createCanvas(1000, 700)

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

	croparea.ellipse(mouseX - lens_size/2, mouseY - lens_size/2, lens_size);

	if(show_TX30) {
		let l1 = singleLayer('2071-2100', 'TX30', 'RCP85', '#ff0086');
		console.log(l1)
		//l1.mask(croparea);
		image(l1,0,0);
	}
	
	if(show_PR95PERC){
		let l2 = singleLayer('2071-2100', 'PR95PERC', 'RCP85', '#f9ff00');

		//l1.mask(croparea);
		image(l2,0,0);
	}

	if(show_PRCPTOT){
		let l3 = singleLayer('2071-2100', 'PRCPTOT', 'RCP85', '#00fff8');

		//l1.mask(croparea);
		image(l3,0,0);
	}
}

function mouseClicked() {
	updateLayers()
	show_lens = true;
}

function singleLayer(_year, _variable, _scenario, _color) {

	//Create a temporary layer
	var layer = createGraphics(windowWidth, windowHeight); 
	layer.pixelDensity(1);

	//load dataset
	var data = fullData.values

	//define style
	layer.fill(_color)
	layer.noStroke();

	//test un po' stupidino
	var p1 = myMap.latLngToPixel(data[0].lat,data[0].lon);
	var p2 = myMap.latLngToPixel(data[1].lat,data[1].lon);
	var distance = (p1.x - p2.x)/5.55; //formula magica, ottini distanza tra punti
	//max value
	var maxVal = Math.sqrt(maxValues[_variable]);
	console.log(maxValues[_variable])

	for (var i in data) {

		let item = data[i];
		const latitude = item.lat
		const longitude = item.lon

		// Transform lat/lng to pixel position
		const pos = myMap.latLngToPixel(latitude, longitude);

		// Get the variables
		let size = Math.sqrt(Math.abs(item[_year][_variable][_scenario]);
		console.log(size);
		size = map(size, 0, maxVal, 0, distance);
		//draw the ellpise
		layer.ellipse(pos.x, pos.y, size, size);
	}
	return layer;
}

