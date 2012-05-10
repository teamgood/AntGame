exports.test_only = exports.test_only || {};

/** 
 * Parses ant world code and returns a grid. Throws an 
 * error if anything is amiss.
 * @param code the code to parse
 * @param contestRules (Optional) If given a truthy value,
 *        contest rules are enforced.
 */
function parseAntWorld(code, contestRules) {
	// replace windows and mac newlines with unix ones
	code = code.replace(/\r\n/g, "\n");
	code = code.replace(/\r/g, "\n");

	// split into lines
	var lines = code.split(/\n/g);
	// remove blank lines at the end
	while (lines[lines.length - 1].trim() === "") {
		lines.splice(lines.length - 1, 1);
	}
	var numLines = lines.length;

	// check we have enough lines
	if ((contestRules && numLines < 2 + 150) ||
		(!contestRules && numLines < 2 + 3)) {
		throw new Error("Too few lines");
	}

	// get grid dimensions
	var dimens = lines.splice(0, 2);
	var width = parseInt(dimens[0].trim(), 10);
	var height = parseInt(dimens[1].trim(), 10);

	// dimensions checks
	if (!width || !height) {
		throw new Error("Could not parse world dimensions");
	}
	if (contestRules && (width !== 150 || height !== 150)) {
		throw new Error("Contest grids must be 150x150");
	}

	if (height !== lines.length) {
		throw new Error("Grid height does not match specified value");
	}

	// parse lines inividually
	var grid = {cells: [], width: width, height: height};
	for (var i = 0; i < height; i++) {
		grid.cells.push(_parseGridLine(lines[i], i % 2 === 1, width));
	}

	// aight, so we've got a well-dimensioned grid
	// now do standard validity checks of grid contents
	if (!_isSurroundedByRock(grid)) {
		throw new Error("The ant world must be enclosed by rock.");
	}
	if (!_gridContains(grid, "+")) {
		throw new Error("The ant wold must contain at least one red hill");
	}
	if (!_gridContains(grid, "-")) {
		throw new Error("The ant wold must contain at least one black hill");
	}
	if (!_gridContains(grid, "f")) {
		throw new Error("The ant wold must contain at least one source of food");
	}

	if (contestRules) {
		// now check for any remaining contest rules
		// we know it's 150x150 and that rocks surround the grid

		// check that there are one of each type of ant hill
		var redHills = _getElements(grid, "+");
		if (redHills.length !== 1) {
			throw new Error("Incorrect number of red hills detected");
		}
		var blackHills = _getElements(grid, "-");
		if (blackHills.length !== 1) {
			throw new Error("Incorrect number of black hills detected");
		}
		
		// check that the hills are the right size and shape
		if (!_isLegalHill(redHills[0])) {
			throw new Error("Red hill is of illegal size and shape");
		}
		if (!_isLegalHill(blackHills[0])) {
			throw new Error("Black hill is of illegal size and shape");
		}

		// check that there are 14 rocks (not inlcuding outer edge)
		var rocks = _getElements(grid, "#");
		if (rocks.length !== 15) {
			throw new Error("There must be 14 incongruous rocky " +
			                "areas unattached to the edge");
		}

		// check that there are 11*25 food deposits and that they each have
		// quantity 5
		var numFood = 0;
		for (var row = 0; row < height; row++) {
			for (var col = 0; col < width; col++) {
				if (grid.cells[row][col].type === "f") {
					numFood++;
					if (grid.cells[row][col].quantity !== 5) {
						throw new Error("The cell at (" + row + "," + col + 
							            ") has an incorrect amount of food");
					}
				}
			}
		}
		if (numFood !== 11 * 25) {
			throw new Error("There are too few food deposits");
		}
		// now check that they are the right shape
		var foods = _getElements(grid, "f");
		for (var i = 0; i < foods.length; i++) {
			if (!_containsLegalFoodBlobs(foods[i])) {
				throw new Error("Mishapen food blobs discovered");
			}
		}
	}
	return grid;
}

exports.parseAntWorld = parseAntWorld;

function _parseGridLine(line, oddLine, supposedWidth) {
	if (oddLine) { // we're expecting a space at the start
		if (line.substr(0, 1) !== " ") {
			throw new Error("No space at start of odd line");
		}
		// remove leading space and check no other spaces exist
		line = line.substr(1);
		if (line.substr(0, 1) === " ") {
			throw new Error("Too much space at start of odd line");
		}
	} else {
		// even line so space is bad
		if (line.substr(0, 1) === " ") {
			throw new Error("Unexpected space at start of even line");
		}
	}

	// get individual chars as array. trim trailing whitespace
	var chars = line.trim().split(/ /g);
	var numChars = chars.length;
	// check for correct width
	if (numChars !== supposedWidth) {
		throw new Error("Grid width mismatch");
	}
	var cells = [];
	for (var i = 0; i < numChars; i++) {
		// check for illegal cell identifiers
		if (!chars[i].match(/[1-9\-.+#]/)) {
			throw new Error("Unrecognised cell identifier: " + chars[i]);
		}
		// append to cells list
		if (chars[i].match(/[1-9]/)) {
			// food so change type to "f" and put value in another property
			cells.push({type: "f", quantity: parseInt(chars[i], 10)});
		} else {
			cells.push({type: chars[i]});
		}
	}
	return cells;
}
exports.test_only._parseGridLine = _parseGridLine;

// checks that there are no gaps around the edges of the grid
function _isSurroundedByRock(grid) {
	// check top and bottom row
	for (var col = 0; col < grid.width; col++) {
		if (grid.cells[0][col].type !== "#" || 
			grid.cells[grid.height - 1][col].type !== "#") {
			return false;
		}
	}
	// check leftmost and rightmost columns
	for (var row = 0; row < grid.height; row++) {
		if (grid.cells[row][0].type !== "#" || 
			grid.cells[row][grid.width - 1].type !== "#") {
			return false;
		}
	}
	return true;
}
exports.test_only._isSurroundedByRock = _isSurroundedByRock;

// searches the grid for a specific cell type
function _gridContains(grid, targetType) {
	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			if (grid.cells[row][col].type === targetType) {
				return true;
			}
		}
	}
}
exports.test_only._gridContains = _gridContains;

// returns a list of 2D arrays which represent the shape of elements of the
// specified target type
// an element is a contiguous region of one particular type
function _getElements(grid, targetType) {
	var elements = [];
	var visitedCells = [];

	// for every cell
	for (var row = 0; row < grid.height; row++) {
		for (var col = 0; col < grid.width; col++) {
			var cell = grid.cells[row][col];
			// if cell not visited and correct type
			if (visitedCells.indexOf(row + ":" + col) === -1 && 
				cell.type === targetType) {
				// get coords of all cells of this element
				var coords = _getElementCoords(grid, row, col);
				// add all coords to visited
				for (var i = 0, len = coords.length; i < len; i++) {
					visitedCells.push(coords[i].row + ":" + coords[i].col);
				}
				// superimpose on box so the shape can be tested
				elements.push(_getElementBox(coords));
			}
		}
	}

	return elements;
}
exports.test_only._getElements = _getElements;


// returns a 2D array of boolean values representing the 
// shape of an element
function _getElementBox(coords) {
	// find min and max rows and cols
	var minRow = coords[0].row,
		maxRow = coords[0].row,
		minCol = coords[0].col,
		maxCol = coords[0].col;

	var len = coords.length;
	for (var i = 0; i < len; i++) {
		var c = coords[i];
		if (c.row > maxRow) { maxRow = c.row; }
		else if (c.row < minRow) { minRow = c.row; }
		
		if (c.col > maxCol) { maxCol = c.col; }
		else if (c.col < minCol) { minCol = c.col; }
	}

	// find dimensions of box
	var width = maxCol - minCol + 1;
	var height = maxRow - minRow + 1;

	// create empty box
	var box = [];
	for (var row = 0; row < height; row++) {
		box[row] = [];
		for (var col = 0; col < width; col++) {
			box[row][col] = false;
		}
	}

	// fill box
	for (var i = 0; i < len; i++) {
		var c = coords[i];
		box[c.row - minRow][c.col - minCol] = true; 
	}
	return {config: box, topRow: minRow};
}
exports.test_only._getElementBox = _getElementBox;


// gets all the coordinates which comprise an element
function _getElementCoords(grid, row, col) {
	var targetType = grid.cells[row][col].type;
	var visitedCells = [];
	var elementCoords = [];
	function visitCell(row, col) {
		if (row >= 0 && row < grid.height && 
		    col >= 0 && col < grid.width &&
		    visitedCells.indexOf(grid.cells[row][col]) === -1) {
			// this is a valid cell we haven't seen before
			visitedCells.push(grid.cells[row][col]);
			if (grid.cells[row][col].type === targetType) {
				// this cell is part of the element
				elementCoords.push({row: row, col: col});
				// explore this cell's adjacent cells
				for (var dir = 0; dir < 6; dir++) {
					var coord = _getAdjacentCoord(row, col, dir);
					visitCell(coord.row, coord.col);
				}
			} else {
				// check for rocks adjacent to ant hills and so forth
				var thisType = grid.cells[row][col].type;
				var throwError = false;
				switch (targetType) {
				case "+":
					if (thisType === "#" || thisType === "-") {
						throwError = true;
					}
					break;
				case "-":
					if (thisType === "#" || thisType === "+") {
						throwError = true;
					}
					break;
				}
				if (throwError) {
					throw new Error("An ant hill cannot be immediately adjacent" + 
					                " to a rock or to the other ant hill.");
				}
			}
		}
	}
	visitCell(row, col);
	return elementCoords;
}
exports.test_only._getElementCoords = _getElementCoords;

// gets the coordinates of the cell adjacent to the cell at
// (row, col) in the specified direction
function _getAdjacentCoord(row, col, direction) {
	direction = Math.abs(direction) % 6;
	var odd = row % 2 === 1;
	function changeRowRight() { col += odd ? 1 : 0; }
	function changeRowLeft() { col -= odd ? 0 : 1; }
	switch (direction) {
	case 0: 
		col++; 
		break;
	case 1: 
		row++; 
		changeRowRight();
		break;
	case 2: 
		row++; 
		changeRowLeft();
		break;
	case 3: 
		col--; 
		break;
	case 4: 
		row--; 
		changeRowLeft();
		break;
	case 5: 
		row--; 
		changeRowRight();
		break;
	}
	return {row: row, col: col};
}
exports.test_only._getAdjacentCoord = _getAdjacentCoord;

// food must be in 5x5 grid
// there are three possible configs, each with two possible manifestations
//   x x x x x    if top    xxxxx     if top   xxxxx  
//    x x x x x    row is   xxxxx     row is    xxxxx 
//     x x x x x    even:    xxxxx     odd      xxxxx 
//      x x x x x            xxxxx               xxxxx
//       x x x x x            xxxxx              xxxxx
//
//       x x x x x  if top    xxxxx   if top    xxxxx
//      x x x x x    row is  xxxxx    row is    xxxxx
//     x x x x x      even:  xxxxx     odd     xxxxx 
//    x x x x x             xxxxx              xxxxx 
//   x x x x x              xxxxx             xxxxx  
//
//          x                 x           x  
//         x x               xx           xx  
//        x x x              xxx         xxx     
//       x x x x            xxxx         xxxx       
//      x x x x x           xxxxx       xxxxx          
//       x x x x            xxxx         xxxx       
//        x x x              xxx         xxx     
//         x x               xx           xx  
//          x                 x           x   
//
// how best to represent this algorithmically? Can't think of a good
// way, especially when another problem is that food elements can 
// touch each other. d'oh!
// so i've opted for an ugly, brute force way of doing it
var foodOverlays = [[[], [], []], [[], [], []]];
foodOverlays[0][0].push([true, true, true, true, true, false, false]);
foodOverlays[0][0].push([true, true, true, true, true, false, false]);
foodOverlays[0][0].push([false, true, true, true, true, true, false]);
foodOverlays[0][0].push([false, true, true, true, true, true, false]);
foodOverlays[0][0].push([false, false, true, true, true, true, true]);

foodOverlays[0][1].push([false, false, true, true, true, true, true]);
foodOverlays[0][1].push([false, true, true, true, true, true, false]);
foodOverlays[0][1].push([false, true, true, true, true, true, false]);
foodOverlays[0][1].push([true, true, true, true, true, false, false]);
foodOverlays[0][1].push([true, true, true, true, true, false, false]);

foodOverlays[0][2].push([false, false, true, false, false]);
foodOverlays[0][2].push([false, true, true, false, false]);
foodOverlays[0][2].push([false, true, true, true, false]);
foodOverlays[0][2].push([true, true, true, true, false]);
foodOverlays[0][2].push([true, true, true, true, true]);
foodOverlays[0][2].push([true, true, true, true, false]);
foodOverlays[0][2].push([false, true, true, true, false]);
foodOverlays[0][2].push([false, true, true, false, false]);
foodOverlays[0][2].push([false, false, true, false, false]);

foodOverlays[1][0].push([true, true, true, true, true, false, false]);
foodOverlays[1][0].push([false, true, true, true, true, true, false]);
foodOverlays[1][0].push([false, true, true, true, true, true, false]);
foodOverlays[1][0].push([false, false, true, true, true, true, true]);
foodOverlays[1][0].push([false, false, true, true, true, true, true]);

foodOverlays[1][1].push([false, false, true, true, true, true, true]);
foodOverlays[1][1].push([false, false, true, true, true, true, true]);
foodOverlays[1][1].push([false, true, true, true, true, true, false]);
foodOverlays[1][1].push([false, true, true, true, true, true, false]);
foodOverlays[1][1].push([true, true, true, true, true, false, false]);

foodOverlays[1][2].push([false, false, true, false, false]);
foodOverlays[1][2].push([false, false, true, true, false]);
foodOverlays[1][2].push([false, true, true, true, false]);
foodOverlays[1][2].push([false, true, true, true, true]);
foodOverlays[1][2].push([true, true, true, true, true]);
foodOverlays[1][2].push([false, true, true, true, true]);
foodOverlays[1][2].push([false, true, true, true, false]);
foodOverlays[1][2].push([false, false, true, true, false]);
foodOverlays[1][2].push([false, false, true, false, false]);

function _containsLegalFoodBlobs(box) {
	var newBox = box;
	var lastGoodBox = box;
	// while we haven't gotten down to an empty box
	while (newBox.config.length > 0) {
		var good = false; // good if an intersection was found
		// for each possible food config
		for (var i = 0; i < 3; i++) {
			newBox = _attemptBoxIntersection(newBox,
			                              foodOverlays[newBox.topRow % 2][i]);
			// we get a reduced box (sans intersecting cells) if
			// successful. Otherwise undefined.
			good = !!newBox; // cast to bool
			if (good) { 
				lastGoodBox = newBox; // this box is good so remember it
				break; 
			} else {
				newBox = lastGoodBox; // the box was bad so revert
			}
		}
		if (!good) { 
			// we got through all three possible food configs and none
			// created valid intersection
			return false;
		}
	}
	return true;
}
exports.test_only._containsLegalFoodBlobs = _containsLegalFoodBlobs;

function _attemptBoxIntersection(box, overlay) {
	box = _cloneBox(box);
	var config = box.config;
	// if underneath is shorten than overlay, no intersection is possible
	if (config.length < overlay.length) {
		return undefined;
	}
	// find indices of first overlap on top row
	var ci, oi;
	for (var i = 0; i < config[0].length; i++) {
		if (config[0][i]) {
			ci = i;
			break;
		}
	}
	for (var i = 0; i < overlay[0].length; i++) {
		if (overlay[0][i]) {
			oi = i;
			break;
		}
	}
	var colOffset = ci - oi;
	// if the overlay doesn't fit within the bounds of the box config, 
	// an intersection is not possible;
	if (colOffset < 0 || colOffset + overlay[0].length > config[0].length) {
		return undefined;
	}
	// now iterate over overlay and check that &&s come out true;
	for (var row = 0; row < overlay.length; row++) {
		for (var col = 0; col < overlay[0].length; col++) {
			if (overlay[row][col]) {
				if (!config[row][col + colOffset]) {
					return undefined;
				} else {
					// blot it out
					config[row][col + colOffset] = false;
				}
			}
		}
	}
	// if we got here without returning undefined, an intersetion was
	// successfully made! hooray!
	return _cropBox(box);
}
exports.test_only._attemptBoxIntersection = _attemptBoxIntersection;

function _cloneBox(box) {
	var newConfig = [];
	for (var i = 0; i < box.config.length; i++) {
		newConfig.push([]);
		for (var j = 0; j < box.config[i].length; j++) {
			newConfig[i][j] = box.config[i][j];
		}
	}
	return {config: newConfig, topRow: box.topRow};
}
exports.test_only._cloneBox = _cloneBox;

function _cropBox(box) {
	box = _cloneBox(box);
	function boxHasDimensions() {
		return box.config.length > 0 && box.config[0].length > 0;
	}
	function colIsEmpty(n) {
		for (var row = 0; row < box.config.length; row++) {
			if (box.config[row][n]) {
				return false;
			}
		}
		return true;
	}
	function rowIsEmpty(n) {
		for (var col = 0; col < box.config[n].length; col++) {
			if (box.config[n][col]) {
				return false;
			}
		}
		return true;
	}
	function deleteCol(n) {
		for (var row = 0; row < box.config.length; row++) {
			box.config[row].splice(n, 1);
		}
	}
	function deleteRow(n) {
		box.config.splice(n, 1);
	}
	while (boxHasDimensions() && rowIsEmpty(0)) {
		deleteRow(0);
		box.topRow++;
	}
	while (boxHasDimensions() && rowIsEmpty(box.config.length - 1)) {
		deleteRow(box.config.length - 1);
	}
	while (boxHasDimensions() && colIsEmpty(0)) {
		deleteCol(0);
	}
	while (boxHasDimensions() && colIsEmpty(box.config[0].length - 1)) {
		deleteCol(box.config[0].length - 1);
	}
	return box;
}
exports.test_only._cropBox = _cropBox;



// hills must look like this:
//        x x x x x x x           xxxxxxx         xxxxxxx               
//       x x x x x x x x         xxxxxxxx         xxxxxxxx                
//      x x x x x x x x x        xxxxxxxxx       xxxxxxxxx                 
//     x x x x x x x x x x      xxxxxxxxxx       xxxxxxxxxx                   
//    x x x x x x x x x x x     xxxxxxxxxxx     xxxxxxxxxxx                    
//   x x x x x x x x x x x x   xxxxxxxxxxxx     xxxxxxxxxxxx                      
//  x x x x x x x x x x x x x  xxxxxxxxxxxxx   xxxxxxxxxxxxx                        
//   x x x x x x x x x x x x                              
//    x x x x x x x x x x x                               
//     x x x x x x x x x x                                
//      x x x x x x x x x                                 
//       x x x x x x x x                                  
//        x x x x x x x                                   
// I can do this one algorithmically

function _isLegalHill(box) {
	if (box.config.length !== 13 ||
		box.config[0].length !== 13) {
		return false;
	}
	function isLegalRow(n) {
		var numCellsOnRow = 13 - Math.abs(n - 6);
		var firstIndex = Math.floor(Math.abs(n - 6) / 2);
		if (box.topRow % 2 === 1 && n % 2 === 1) {
			firstIndex++;
		}
		for (var i = 0; i < 13; i++) {
			if (i >= firstIndex && i < firstIndex + numCellsOnRow) {
				// these cells should be hills
				if (!box.config[n][i]) {
					return false;
				}
			} else {
				// these cells should be empty
				if (box.config[n][i]) {
					return false;
				}
			}
		}
		return true;
	}

	// iterate over rows
	for (var row = 0; row < 13; row++) {
		if (!isLegalRow(row)) {
			return false;
		}
	}

	return true;
}
exports.test_only._isLegalHill = _isLegalHill;
