var HEALVALUE = 1;
var ATTACKVALUE = 1;
var RANGEDVALUE = 1;
var TOUGHVALUE = 0.5;

var enemyAnalyzer = {
    run: function() {
    	if (Memory.analyzeRequests == null) {
    		Memory.analyzeRequests = [];
    	}
    	if (Memory.lastAnalyzed == null) {
    		Memory.lastAnalyzed = {};
    	}
		for (var i = 0; i < Memory.analyzeRequests.length; i++) {
			this.analyzeEnemy(Memory.analyzeRequests[i]);
		}
    	Memory.analyzeRequests = [];
    },
    request: function(roomname) {
    	if (Memory.analyzeRequests.indexOf(roomname) == -1) {
    		Memory.analyzeRequests.push(roomname);
    	}
    },
    analyzeEnemy: function(room) {
    	var tickssincelast = Game.time - Memory.lastAnalyzed[room];
    	if (tickssincelast < 50) {
    		return;
    	}
        var room = Game.rooms[room]; 
        if (room == null) {
            return;
        }
    	var creeps = room.find(FIND_HOSTILE_CREEPS, {
		    filter: function(object) {
		        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 || object.getActiveBodyparts(HEAL) > 0;
		    }
		});
    	var enemies = this.getCreepReports(creeps);
    	var friends = room.find(FIND_MY_CREEPS, {
		    filter: function(object) {
		        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 || object.getActiveBodyparts(HEAL) > 0;
		    }
		});
    	var friendlies = this.getCreepReports(friends);
    	
		var report = this.reportForce(enemies, friendlies, room);
		Memory.lastAnalyzed[room] = Game.time; 
		//console.log(report);
		Game.notify(report);
    },
    getCreepReports: function(creeps) {
    	var reports = [];
    	for (var i = 0; i < creeps.length; i++) {
    		var creep = creeps[i]; 
    		var value = 0;
    		var attack = creep.getActiveBodyparts(ATTACK);
    		var heal = creep.getActiveBodyparts(HEAL);
    		var ranged = creep.getActiveBodyparts(RANGED_ATTACK);
    		var tough = creep.getActiveBodyparts(TOUGH);
    		var owner = creep.owner.username;
    		value += attack * ATTACKVALUE; 
    		value += heal * HEALVALUE; 
    		value += ranged * RANGEDVALUE; 
    		value += tough * TOUGHVALUE; 
    		reports.push({
    			attack: attack,
    			heal: heal, 
    			ranged: ranged,
    			tough: tough,
    			owner: owner,
    			value: value
    		});
    	}
    	return reports; 
    },
    reportToStr: function(enemy) {
    	var str = ""; 
    	str += "Owner: " + enemy.owner + " A: " + enemy.attack + " R: " + enemy.ranged + " H: " + enemy.heal + " T: " + enemy.tough + " val: " + enemy.value;
    	return str; 
    },
    reportForce: function(enemies, friendlies, roomname) {
        var str = roomname + "\n";
    	str += "Friendly composition:\n"; 
    	var totalval = 0;
    	for (var i = 0; i < friendlies.length; i++) {
    		var friend = friendlies[i];
    		str += this.reportToStr(friend) + "\n";
    		totalval += friend.value;
    	}
    	str += "Total friendly force value: " + totalval + "\n\n";
    	str += "Enemy composition:\n";
		totalval = 0; 
    	for (var i = 0; i < enemies.length; i++) {
    		var enemy = enemies[i];
    		str += this.reportToStr(enemy) + "\n";
    		totalval += enemy.value; 
    	}
    	str += "Total enemy force value: " + totalval + "\n";
    	return str;
    }
}

module.exports = enemyAnalyzer; 