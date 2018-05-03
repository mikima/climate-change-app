// API Key for MapboxGL. Get one here:
// https://www.mapbox.com/studio/account/tokens/
const key = 'pk.eyJ1IjoibWlraW1hIiwiYSI6IjNvWUMwaUEifQ.Za_-O03W3UdQxZwS3bLxtg';


// Options for map
const options = {
	lat: 42,
	lng: 12,
	zoom: 5.5,
	style: 'light-v9',
	pitch: 0,
	width: 960,
	height: 960
};



// Create an instance of MapboxGL
const mappa = new Mappa('Mapbox', key);
const myMap = mappa.staticMap(options);
let mapImg;

let canvas;
// datasets
let fullData, province;

//which layers
var show_TX30 = true;
var show_PRCPTOT = true;
var show_PR95PERC = false;
//lens variables
var show_lens = false;
var lens_size = 100;



//
var polygons;

//max values, pre-calculated
var maxValues = {
	'TX30': 74,
	'PRCPTOT': -410,
	'PR95PERC': 88
}

let w,h;

function preload() {
	fullData = loadJSON('assets/climatechange_data.json');
	province = loadJSON('assets/contorniProvince.json');
	mapImg = loadImage(myMap.imgUrl);
}

function setup() {
	w = 960;
	h = 960;
	canvas = createCanvas(w,h);
	// Create a tile map and overlay the canvas on top.
	image(mapImg,0,0)
	initMap();
	
}

// The draw loop is fully functional but we are not using it for now.
function draw() {
	//drawDancingPoints()
}

// single layers
var l1, l2, l3,
	l1_45, l2_45, l3_45 

// crop areas
var croparea, cropinverse;


function initMap() {
	//render all the layers
	l1 = singleLayer('2071-2100', 'TX30', 'RCP85', '#ff0086');
	l2 = singleLayer('2071-2100', 'PR95PERC', 'RCP85', '#f9ff00');
	l3 = singleLayer('2071-2100', 'PRCPTOT', 'RCP85', '#00fff8');
	l1_45 = singleLayer('2071-2100', 'TX30', 'RCP45', '#ff0086');
	l2_45 = singleLayer('2071-2100', 'PR95PERC', 'RCP45', '#f9ff00');
	l3_45 = singleLayer('2071-2100', 'PRCPTOT', 'RCP45', '#00fff8');
	polygons = renderFeatures(province);
	//
	croparea = createGraphics(w,h);
	//croparea.id('croparea')
	cropinverse = createGraphics(w,h);
	//cropinverse.id('cropinverse')
	//update
	updateLayers(0,0)
}

function updateLayers(_x,_y) {

	console.log(_x,_y);
	clear();
	image(mapImg,0,0);
	blendMode(MULTIPLY);

	//calculate the crop area
	croparea.pixelDensity(1);
	croparea.background(255);
	croparea.fill(0);
	croparea.noStroke();
	croparea.ellipseMode(CENTER);
	croparea.ellipse(_x, _y, lens_size);

	//image(croparea,0,0);
	cropinverse.pixelDensity(1);
	cropinverse.background(0);
	cropinverse.fill(255);
	cropinverse.noStroke();
	cropinverse.ellipseMode(CENTER);
	cropinverse.ellipse(_x, _y, lens_size);

	if (show_TX30) {
		image(pgMask(l1,croparea), 0, 0);
		image(pgMask(l1_45,cropinverse),0,0);
	}

	if (show_PR95PERC) {
		image(pgMask(l2,croparea), 0, 0);
		image(pgMask(l2_45,cropinverse),0,0);
	}

	if (show_PRCPTOT) {
		image(pgMask(l3,croparea), 0, 0,w,h);
		image(pgMask(l3_45,cropinverse),0,0);
	}

	//image(pgMask(renderProvinces(),cropinverse),0,0,w,h);
	image(pgMask(renderPolygons(polygons),cropinverse),0,0)

}

function singleLayer(_year, _variable, _scenario, _color) {

	//Create a temporary layer
	var layer = createGraphics(w, h);
	//layer.pixelDensity(1);

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

	return layer;//pgToImg(layer);
}

function renderProvinces() {

	var layer = createGraphics(w, h);
	//layer.pixelDensity(1);

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

function renderPolygons(_polygons) {

	var layer = createGraphics(w, h);

	//layer.pixelDensity(1);
	layer.noFill();

	_polygons.forEach(function(poly){
		//first, perform hittest
		var hitTest = collidePointPoly(mouseX, mouseY, poly.polygon);
		//change color according to the test
		layer.stroke(hitTest == true ? 'red' : 'black');
		//log the properties
		if(hitTest) {
			//console.log(poly.properties)
		}
		layer.beginShape();
		//now draw the shape
		poly.polygon.forEach(function(p){
			layer.vertex(p.x, p.y);
		})
		layer.endShape();
	});

	return pgToImg(layer);
}

// from an array of geo features, return an array of polygons.
// useful in combination with hittest

function renderFeatures(_geoJson) {
	var results = [];

	var features = _geoJson.features;

	features.forEach(function(feature) {

		//get coordinates
		var coords = feature.geometry.coordinates;

		for (var i = 0; i < coords.length; i++) {

			//Create an new object
			var item = {}
			item.properties = feature.properties;
			item.polygon = [];
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
				item.polygon.push(createVector(pos.x,pos.y));
			}
			//append to results
			results.push(item);
		}
	})
	// return thee results
	return results;
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

function pgToImg(_pg){
	var outimg = createImage(_pg.width, _pg.height);
	outimg.copy(_pg, 0, 0, _pg.width, _pg.height, 0, 0, _pg.width, _pg.height);
	_pg.remove();
	return outimg;
}


function touchMoved() {
	console.log(touches[0])
	updateLayers(touches[0].x,touches[0].y);
}

function touchEnded() {
	updateLayers(0,0);
}