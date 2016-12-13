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
var LRHAULERROOMS = ['W18N66', 'W19N67', 'W17N66', 'W19N68', 'W17N67', 'W18N65'];
var FREQ = 50;
var economyMonitor = {
	lrminingRooms: {
		'W18N66': 2,
		'W17N67': 2, 
		'W19N67': 1
	},
	getLrHaulerNeedForRoom (room) {
		return this.lrminingRooms[room];
	},
	run: function() {
		this.lrMinerNeed();
		if (Memory.economyMonitor == null || Memory.economyMonitor.lastRan == null) {
			Memory.economyMonitor = {};
			Memory.economyMonitor.lastRan = Game.time; 
		}
		if (Game.time - Memory.economyMonitor.lastRan > FREQ) {
			//this.analyze();
			Memory.economyMonitor.lastRan = Game.time;
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
		var obj = Game.getObjectById(containerid);
		if (Memory.lrcontainers[containerid] == null) {
			Memory.lrcontainers[containerid] = { 
				room: obj.room.name, 
				x: obj.pos.x, 
				y: obj.pos.y
			};
		}
	},
	getLrMinerRoomTarget: function() {
        var lrm = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer');
        var neededrooms = [];
		for (var key in this.lrminingRooms) {
			var needed = this.lrminingRooms[key]; 
			var targeting = _.filter(lrm, (creep) => creep.memory.room == key); 
			var targetingUnhealthy = _.filter(lrm, (creep) => creep.memory.room == key && creep.ticksToLive < 200);
			if (((needed + targetingUnhealthy.length) - targeting.length) > 0) {
				console.log("getLrMinerRoomTarget returning " + key);
				return key;
			}
		}
		console.log("getLrMinerRoomTarget returning nothing");
		return;
	},
	lrMinerNeed: function() {
		if (Memory.lrMinerNeed != null) {
			if (Memory.lrMinerNeed.time == Game.time) {
				return Memory.lrMinerNeed.needed; 
			} else {
				Memory.lrMinerNeed = null;
			}
		}
        var lrm = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer');
        var spawns = _.filter(Game.spawns, (spawn) => spawn.spawning != null && spawn.spawning.name.substring(0, 14) == 'longrangeminer');
        //console.log("spawns spawning lrminers: " + spawns.length);
        var neededrooms = [];
		for (var key in this.lrminingRooms) {
			var needed = this.lrminingRooms[key]; 
			var targeting = _.filter(lrm, (creep) => creep.memory.room == key); 
			var targetingUnhealthy = _.filter(lrm, (creep) => creep.memory.room == key && creep.ticksToLive < 200);
			if (((needed + targetingUnhealthy.length) - targeting.length) > 0 && spawns.length < 1) {
				neededrooms.push(key);
			}
			//console.log("lrMinerNeed: " + key + ", targeting: " + targeting.length + ", targetingUnhealthy: " + targetingUnhealthy.length + ", needed: " + needed);
			//console.log("lrMinerNeed: reccomend spawning for room " + key + ": " + needed);
		}
		Memory.lrMinerNeed = { time: Game.time, needed: neededrooms };
		return neededrooms; 
	},
	lrHaulerNeed: function() {
		if (Memory.lrHaulerNeed != null) {
			if (Memory.lrHaulerNeed.time == Game.time) {
				return Memory.lrHaulerNeed.needed; 
			} else {
				Memory.lrHaulerNeed = null;
			}
		}
        var lrHaulerNeed = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler');
        var spawns = _.filter(Game.spawns, (spawn) => spawn.spawning != null && spawn.spawning.name.substring(0, 8) == 'lrhauler');
        var neededrooms = [];
		for (var key in this.lrminingRooms) {
			var needed = this.lrminingRooms[key]; 
			var targeting = _.filter(lrHaulerNeed, (creep) => creep.memory.room == key); 
			var targetingUnhealthy = _.filter(lrHaulerNeed, (creep) => creep.memory.room == key && creep.ticksToLive < 200);
			if (((needed + targetingUnhealthy.length) - targeting.length) > 0 && spawns.length < 1) {
				neededrooms.push(key);
			}
			//console.log("lrMinerNeed: " + key + ", targeting: " + targeting.length + ", targetingUnhealthy: " + targetingUnhealthy.length + ", needed: " + needed);
			//console.log("lrMinerNeed: reccomend spawning for room " + key + ": " + needed);
		}
		Memory.lrHaulerNeed = { time: Game.time, needed: neededrooms };
		return neededrooms; 
	},
	getLrHaulerRoomTarget: function() {
		var lrHaulerNeed = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler');
        var neededrooms = [];
		for (var key in this.lrminingRooms) {
			var needed = this.lrminingRooms[key]; 
			var targeting = _.filter(lrHaulerNeed, (creep) => creep.memory.room == key); 
			var targetingUnhealthy = _.filter(lrHaulerNeed, (creep) => creep.memory.room == key && creep.ticksToLive < 200);
			if (((needed + targetingUnhealthy.length) - targeting.length) > 0) {
				console.log("getLrHaulerRoomTarget returning " + key);
				return key;
			}
		}
		//console.log("getLrHaulerRoomTarget returning nothing");
		return;
	}
}

module.exports = economyMonitor;