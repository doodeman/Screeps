var creepManager = {
	run: function() {
		if (Game.time%10 == 0) {
			this.reportCreeps();
			this.reportCreepsBySpawn();
			this.reportLRMiners();
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
			var retstr = name + " creeps: ";
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
	}
}

module.exports = creepManager;