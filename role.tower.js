
var analyzer = require('enemyAnalyzer');


var roleTower = {
    run: function() {
        this.updateTowers(); 
        for (var tid in Memory.towers.towers) {
        	var tower = Game.getObjectById(tid); 

        	if (tower != null) {
		        var hostiles = tower.room.find(FIND_HOSTILE_CREEPS); 
		        if (hostiles.length > 0) {
		            tower.room.controller.activateSafeMode();
		            tower.attack(hostiles[0]);
		            analyzer.request(tower.room.name);
		        }
        	} else {
        		console.log("removing nonexistant tower " + tid); 
        		Memory.towers.towers[tid] = null;
        	}

        }
    },
    updateTowers: function() {
		if (Memory.towers == null) {
			Memory.towers = {};
    		Memory.towers.towers = {};
    		Memory.towers.updated = Game.time; 
    	}
    	if (Game.time - Memory.towers.updated > 100 || Object.keys(Memory.towers.towers).length == 0) {
    		console.log("updating towers");
	    	towerIds = []; 
	    	for (var name in Game.spawns) {
	    		var spawn = Game.spawns[name]; 
	        	var towers = spawn.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}); 
	        	for (var i = 0; i < towers.length; i++) {
	        		tower = towers[i]; 
	        		Memory.towers.towers[tower.id] = tower; 
	        	}
	    	}
	    	Memory.towers.updated = Game.time;
    	}
    }
};


module.exports = roleTower;