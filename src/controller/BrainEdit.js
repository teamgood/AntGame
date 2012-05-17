var BRAIN_EDIT = (function () {
	var _onCompile = function () {};

	var go = function (title, compileCallback) {
		if (typeof compileCallback === "function") {
			_onCompile = compileCallback;
		} else {
			_onCompile = function () {};
		}
		if (typeof title !== "string") {
			title = "Edit";
		}
		view.edit.text("title", title + " Brain");
		view.edit.text("name", "");
		view.edit.text("code", "");
		view.edit.show();
	};

	var init = function () {
		view.edit.on("compile", function () { 
			try {
				model.parseAntBrain(view.edit.text("code"));
				var brain = {
					name: view.edit.text("name"),
					source: view.edit.text("code"),
					preset: false
				};
				view.edit.hide();
				_onCompile(brain);
			} catch (err) {
				window.alert(err.message);
			}
		});
		view.edit.on("cancel", function () {
			view.edit.hide();
		});
	};

	return {
		go: go,
		init: init
	}

})();