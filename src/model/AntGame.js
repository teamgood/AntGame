var Ant = Ant || function () {}; // to avoid lint errors
/**
 * AntGame objects represent a match between two ant brains on a specific
 * world.
 * @param redBrain the brain of the ants on the red team
 * @param blackBrain the brain of the ants on the black team
 * @param world the world in which the ants compete
 */
function AntGame(redBrain, blackBrain, world) {
	var ants = [];
	var id = 0;
	// populate world with ants
	for (var row = 0; row < world.height; row++) {
		for (var col = 0; col < world.width; col++) {
			var cell = world.getCell(row, col);
			if (cell.type === "black hill") {
				var ant = new Ant(id++, "black", blackBrain, world);
				ants.push(ant);
				cell.setAnt(ant);
			} else if (cell.type === "red hill") {
				var ant = new Ant(id++, "red", redBrain, world);
				ants.push(ant);
				cell.setAnt(ant);
			}
		}
	}
	var numAnts = ants.length;

	var run = function (iterations) {
		for (var i = 0; i < iterations; i++) {
			for (var id = 0; id < numAnts; id++) {
				ants[id].step();
			}
		}
	};

	return {
		run: run
	};
}
exports.AntGame = AntGame;