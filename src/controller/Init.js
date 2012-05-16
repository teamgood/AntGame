$(document).ready(function () {
	// var activeMatch = Match(), 
	// 	activeContest = Contest();

	// setup initial view config
	view.init();
	view.goto("root");

	// setup nav buttons
	view.on("goto_main_menu", function () {
		view.goto("root");
	});

	view.on("goto_single_match", function () {
		view.goto("single_match");
	});

	view.on("sm_pick_red_brain", function () {
		view.goto("sm_pick_brain")
	});

	view.on("sm_pick_black_brain", function () {
		view.goto("sm_pick_brain")
	});

	view.on("brain_list_select", function (id) {
		view.brain_list.highlight(id);
	});

	view.brain_list.add("Bananas", 4);

	view.brain_list.add("Cavalry", 8);
	view.brain_list.add("Smithers", 9);
	view.brain_list.add("Michael Jackson", 7);
	view.brain_list.add("Britney", 83);
});