var creepManager = {
	run: function() {
		if (Game.time%10 == 0) {
			this.reportCreeps();
			this.reportCreepsBySpawn();
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
	}
}

module.exports = creepManager;