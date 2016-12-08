/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('economymonitor');
 * mod.thing == 'a thing'; // true
 */
var shared = require('shared');
var configs = require('configs');
var ROOMS = ['W19N66', 'W18N66', 'W18N67'];
var LRHAULERROOMS = ['W18N66', 'W19N67', 'W17N66', 'W19N68', 'W17N67'];
var FREQ = 50;
var economyMonitor = {
	run: function() {
		if (Game.time % FREQ == 0) {
			this.analyze();
			this.updateContainers(); 
			this.updateLrHaulerNeed();
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
	},
	registerContainer: function(containerid, spawn) {
		if (Memory.lrcontainers == null) {
			Memory.lrcontainers = {}; 
		}
		if (spawn == undefined) {
			var spawn = Game.getObjectById('583d68476058ee051590a195');
		} else {
			var spawn = Game.spawns[spawn];
		}
		var obj = Game.getObjectById(containerid);
		if (Memory.lrcontainers[containerid] == null) {
			var distance = shared.getMultiroomPathLength(obj.pos.x, obj.pos.y, obj.room.name, spawn.pos.x, spawn.pos.y, spawn.room.name);
			console.log("distance is " + distance);
			Memory.lrcontainers[containerid] = {
				spawn: spawn.name, 
				room: obj.room.name, 
				x: obj.pos.x, 
				y: obj.pos.y,
				distance: distance
			};
		}
	},
	updateContainers: function() {
		for (var cname in Memory.lrcontainers) {
			//console.log("cname " + cname);
			var containerinfo = Memory.lrcontainers[cname]; 
			var container = Game.getObjectById(cname);
			//console.log("container : " +container);
			if (container != null) {			
				var lrhaulercarry = this.getConfigCarryCapacity(configs.lrhauler);
				var roomclaimed = Game.rooms[container.room.name].controller.reservation != null; 
				//console.log("roomclaimed " + roomclaimed + " lrhaulercarry " + lrhaulercarry + " container " + container);
				if (roomclaimed) {
					var sourcerate = 3000/300;
				} else {
					var sourcerate = 1500/300; 
				}
				//console.log("containerinfo.distance " + containerinfo.distance);
				var haulrate = lrhaulercarry / (containerinfo.distance * 2);
				var haulersneeded = Math.ceil(haulrate/sourcerate); 
				console.log("container " + cname + " in " + container.room.name + " sourcerate " + sourcerate + " haulrate " + haulrate + " haulers needed " + haulersneeded);
				Memory.lrcontainers[cname].haulersneeded = haulersneeded;
			}
		}
	},
	getConfigCarryCapacity: function(config) {
		var ret = 0; 
		for (var i = 0; i < config.length; i++) {
			if (config[i] == CARRY) {
				ret += 50; 
			}
		}
		return ret;
	},
	getLrHaulerNeedForRoom: function(room) {
		//console.log("returning need for room " + room);
		return Memory.lrhaulerneed[room];
	},
	updateLrHaulerNeed: function() {
		if (Memory.lrhaulerneed == null) {
			Memory.lrhaulerneed = {};
		}
		for (var room in LRHAULERROOMS) {
			var roomname = LRHAULERROOMS[room];
			//Memory.lrhaulerneed[roomname] = this.getLrHaulerNeedForRoom(roomname); 
			if (roomname == 'W17N67' || roomname == 'W18N66') {
				Memory.lrhaulerneed[roomname] = 2;
				return;
			}
			Memory.lrhaulerneed[roomname] = 1; //fix this
		}
	}

}

module.exports = economyMonitor;