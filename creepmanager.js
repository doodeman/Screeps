var creepManager = {
	run: function() {
		if (Memory.creepManager == null) {
			Memory.creepManager = {}; 
		}
		if (Memory.creepManager.lastRan == null) {
			Memory.creepManager.lastRan = Game.time; 
		}
		if (Game.time - Memory.creepManager.lastRan > 10) {
			this.reportCreeps();
			this.reportCreepsBySpawn();
			this.reportLRMiners();
			Memory.creepManager.lastRan = Game.time;
		}
	},
	reportCreeps: function() {
		var roles = {};
		for(var name in Game.creeps) {
			var creep = Game.creeps[name]; 
			if (roles[creep.memory.role] == null) {
				roles[creep.memory.role] = 1; 
			} else {
				roles[creep.memory.role] += 1; 
			}
		}
		var retstr = "All creeps: "; 
		for (var role in roles) {
			retstr += role + ": " + roles[role] + " ";
		}
		console.log(retstr);
		
	}, 
	reportCreepsBySpawn: function() {
		for(var name in Game.spawns) {
			var spawn = Game.spawns[name];
			var roles = {};
			for (var cname in Game.creeps) {
				var creep = Game.creeps[cname]; 
				if (creep.memory.spawn == name) {
					if (roles[creep.memory.role] == null) {
						roles[creep.memory.role] = 1; 
					} else {
						roles[creep.memory.role] += 1; 
					}
				}
				
			}
			var spawnname = ""; 
			if (spawn.spawning != null) {
				spawnname = spawn.spawning.name; 
			}
			var retstr = name + " spawning: " + spawnname + ", creeps: ";
			for (var role in roles) {
				retstr += role + ": " + roles[role] + " ";
			}
			console.log(retstr);
		}
	},
	reportLRMiners: function() {
		var minertargets = {};
		var haulertargets = {};
		for (var name in Game.creeps) {
			var creep = Game.creeps[name];
			if (creep.memory.role == 'longrangeminer') {
				if (minertargets[creep.memory.room] == null) {
					minertargets[creep.memory.room] = 1; 
				} else {
					minertargets[creep.memory.room] += 1; 
				}
			}
			if (creep.memory.role == 'lrhauler') {
				if (haulertargets[creep.memory.room] == null) {
					haulertargets[creep.memory.room] = 1; 
				} else {
					haulertargets[creep.memory.room] += 1; 
				}
			}
		}
		var report = "Miner targets: "; 
		for (var t in minertargets) {
			report += t + ": " + minertargets[t] + " ";
		}
		report += "\nHauler targets:"; 
		for (var t in haulertargets) {
			report += t + ": " + haulertargets[t] + " ";
		}
		console.log(report);
	},
	creepRoles: {
	    'lrhauler': {
	        max: function() {
	        	return 6;
	            var totalneed = 0; 
	            for (var room in LRMINEROOMS[spawn.name]) {
	                totalneed += economyMonitor.getLrHaulerNeedForRoom(LRMINEROOMS[spawn.name][room]);
	            }
	            return totalneed;
	        },
	        configuration: function() {
	        	return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
	    	}
	    },
	    'healer': {
	    	max:function() {
	    		return 1; 
	    	},
	    	configuration: function() { 
	    		return [HEAL, MOVE, HEAL, MOVE, HEAL, MOVE];
	    	}
	    },
	    'warrior': {
	        max: function() {
	            return 1;
	        },
	        configuration: function() {
	        	return [TOUGH, ATTACK, MOVE, TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE,TOUGH, ATTACK, MOVE];
	        }
	    },
	    'longrangeminer': {
	        max: function() {
	            return 6;
	        },
	        configuration: function() {
	        	return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
	        }
	    },
	    'roamingworker': {
	    	max: function() {
	    		return 1; 
	    	}, 
	    	configuration: function() {
	    		return [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
	    	}
	    },
	    'targetedbuilder': {
	    	max: function() {
	    		return 0; 
	    	}, 
	    	configuration: function() {
	    		return [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE];
	    	}
	    },
	    'explorer': {
	    	max: function() {
	    		return 0; 
	    	}, 
	    	configuration: function() {
	    		return [ATTACK, ATTACK, MOVE, MOVE];
	    	}
	    }
	}
}

module.exports = creepManager;