/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('economymonitor');
 * mod.thing == 'a thing'; // true
 */

var ROOMS = ['W19N66', 'W18N66', 'W18N67'];
var FREQ = 50;
var economyMonitor = {
	run: function() {
		if (Game.time % FREQ == 0) {
			this.analyze();
		}
	}, 
	analyze: function() {
		var problems = this.analyzeContainers(); 
		problems = problems.concat(this.analyzeSources());
		var probstr = this.problemsToStr(problems);
		if (problems.length > 0) {
			console.log(probstr); 
			Game.notify(probstr);
		}
	},
	analyzeContainers: function() {
		var problems = [];
		var containers = []; 
		for (var i = 0; i < ROOMS.length; i++) {
			var room = Game.rooms[ROOMS[i]]; 
			if (room != null) {
				var roomconts = room.find(FIND_STRUCTURES, {
					filter: { structureType: STRUCTURE_CONTAINER }
				});
				for (var n = 0; n < roomconts.length; n++) {
					containers.push(roomconts[n]);
				}
			}
		}
		for (var i = 0; i < containers.length; i++) {
			var container = containers[i]; 
			if (container.store[RESOURCE_ENERGY] == container.storeCapacity) {
				problems.push({
					room: container.room.name, 
					description: "Container is full",
					id: container.id, 
					tick: Game.time,
				});
			}
		}
		return problems; 
	},
	analyzeSources: function() {
		var problems = []; 
		var sources = []; 
		for (var i = 0; i < ROOMS.length; i++) {
			var room = Game.rooms[ROOMS[i]]; 
			if (room != null) {
				var roomsources = room.find(FIND_SOURCES);
				sources = sources.concat(roomsources);
			}
		}
		for (var i = 0; i < sources.length; i++) {
			var source = sources[i];
			if (source.energy > 200 && source.ticksToRegeneration < FREQ) {
				problems.push({
					room: source.room.name, 
					description: 'Source about to renew and not fully mined, remaining: ' + source.energy + " ticks to renew: " + source.ticksToRegeneration,
					id: source.id, 
					tick: Game.time
				});
			}
		}
		return problems;
	},
	problemsToStr: function(problems) {
		var str = ""; 
		for (var i = 0; i < problems.length; i++) {
			var problem = problems[i];
			str += "Room: " + problem.room + "\n"; 
			str += "Description: " + problem.description + "\n";
			str += "id: " + problem.id + "\n"; 
			str += "tick: " + problem.tick+ "\n\n";
		}
		return str;
	}
}

module.exports = economyMonitor;