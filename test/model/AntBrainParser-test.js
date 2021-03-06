var imports = require("../../src/model/AntBrainParser.js");
var parseAntBrain = imports.parseAntBrain;
var _parseInt = imports.test_only._parseInt;
var _parseLine = imports.test_only._parseLine;

exports["Test that _parseInt strips zeroes properly"] = function (test) {
	test.expect(3);
	test.strictEqual(3,_parseInt("00003"),"these should be equal");
	test.strictEqual(30,_parseInt("0030"),"these should be equal");
	test.strictEqual(0,_parseInt("000"),"these should be equal");
	test.done();
};

// _parseLine is tested pretty explicitly by the parseAntBrain function so I
// won't bother with unit tests.

var goodBrain = [
	"", // empty lines to see if they get ignored
	"Flip 6 5 1",
	"Turn Right 0 ; this is a comment",
	"Drop 1",
	"",
	"PickUp 2 7",
	"Unmark 3 5    ;this is also a comment",
	"Mark 3 4",
	"Sense LeftAhead 0 3 Rock",
	"Sense RightAhead 2 8 Marker 4",
	"Move 1 2",
	"",
];

var expectedGoodBrain = [
	{type: "flip", p: 6, st1: 5, st2: 1},
	{type: "turn", dir: "right", st: 0},
	{type: "drop", st: 1},
	{type: "pickup", st1: 2, st2: 7},
	{type: "unmark", marker: 3, st: 5},
	{type: "mark", marker: 3, st: 4},
	{type: "sense", dir: "leftahead", st1: 0, st2: 3, condition: "rock", marker: -1},
	{type: "sense", dir: "rightahead", st1: 2, st2: 8, condition: "marker", marker: 4},
	{type: "move", st1: 1, st2: 2}
];

// we want to test with windows, mac and unix newlines, so...
var goodBrainWindows = goodBrain.join("\r\n");
var goodBrainMac = goodBrain.join("\r");
var goodBrainUnix = goodBrain.join("\n");

exports["Test that the parser works for Windows newlines."] = function (test) {
	test.deepEqual(parseAntBrain(goodBrainWindows),expectedGoodBrain,"parsing with Windows newlines");
	test.done();
};

exports["Test that the parser works for Mac newlines."] = function (test) {
	test.deepEqual(parseAntBrain(goodBrainMac),expectedGoodBrain,"parsing with Mac newlines");
	test.done();
};

exports["Test that the parser works for Unix newlines."] = function (test) {
	test.deepEqual(parseAntBrain(goodBrainUnix),expectedGoodBrain,"parsing with Unix newlines");
	test.done();
};

/*** CHECK FOR EXCEPTIONS THROWN ***/

var badBrain_nostates = [
	"", // empty lines to see if they get ignored
	""
].join("\n");

exports["Test that an error is thrown when the brain has no states"] = function (test) {
	test.throws(function () {
		parseAntBrain(badBrain_nostates);
	}, "An error should be thrown");
	test.done();
};

var badBrain_syntaxError = [
	"", // empty lines to see if they get ignored
	"Flip 6 5 1",
	"Turn Right 0",
	"Drop 1",
	"",
	"PickUp 2 7",
	"Unmark 3 5",
	"Mark 3 4",
	"Sensed LeftAhead 0 3 Rock", // error is here (line 9)
	"Sense RightAhead 2 8 Marker 4",
	"Move 1 2",
	"",
].join("\n");

exports["Test for thrown error when brain has syntax error"] = function (test) {
	test.expect(2);
	test.throws(function () {
		parseAntBrain(badBrain_syntaxError);
	}, "An error should be thrown");
	try {
		parseAntBrain(badBrain_syntaxError);
	} catch (err) {
		test.strictEqual(err.line, 9, "these two numbers should be equal");
	}
	test.done();
};

var badBrain_noSuchState = [
	"", // empty lines to see if they get ignored
	"Flip 6 5 1",
	"Turn Right 0",
	"Drop 1",
	"",
	"PickUp 2 9", //error is here (line 6)
	"Unmark 3 5",
	"Mark 3 4",
	"Sense LeftAhead 0 3 Rock",
	"Sense RightAhead 2 8 Marker 4",
	"Move 1 2",
	"",
].join("\n");

exports["Test for thrown error when nonexistent state pointed to"] = function (test) {
	test.expect(2);
	test.throws(function () {
		parseAntBrain(badBrain_noSuchState);
	}, "An error should be thrown");
	try {
		parseAntBrain(badBrain_noSuchState);
	} catch (err) {
		test.strictEqual(err.line,6, "these two numbers should be equal");
	}
	test.done();
};

var badBrain_markerTooHigh = [
	"", // empty lines to see if they get ignored
	"Flip 6 5 1",
	"Turn Right 0",
	"Drop 1",
	"",
	"PickUp 2 7",
	"Unmark 3 5",
	"Mark 5 4", //error is not here
	"Mark 6 4", //error is here (line 9)
	"Sense LeftAhead 0 3 Rock",
	"Sense RightAhead 2 8 Marker 4",
	"Move 1 2",
	"",
].join("\n");

exports["Test for thrown error when illegal marker number given"] = function (test) {
	test.expect(2);
	test.throws(function () {
		parseAntBrain(badBrain_markerTooHigh);
	}, "An error should be thrown");
	try {
		parseAntBrain(badBrain_markerTooHigh);
	} catch (err) {
		test.strictEqual(err.line,9, "these two numbers should be equal");
	}
	test.done();
};