var ROOMS = ['W18N66', 'W19N67', 'W17N66', 'W19N68'];
var shared = require('shared');

var findRoom = function(creep) {
	var need = {}; 
	for (var i =0; i < ROOMS.length; i++) {
		var room = Game.rooms[ROOMS[i]]; 
		if (room == null) {
		    return ROOMS[i];
		}
		var needrepairs = room.find(FIND_STRUCTURES, {
			filter: function(obj) {
				return (obj.hits < obj.hitsMax*0.8);
		}});
		var needbuilding = room.find(FIND_CONSTRUCTION_SITES);
		var needval = 0; 
		for (var n = 0; n < needrepairs.length; n++) {
			var obj = needrepairs[n];
			var objneedval = (obj.hits < obj.hitsMax*0.8);
			needval += objneedval;
		}
		for (var n = 0; n < needbuilding.length; n++) {
			needval += 500;
		}
		need[ROOMS[i]] = needval; 
	}
	var mostneed = 0;
	var mostneedname = ROOMS[0]; 
	var isdefault = true; 
	for (var i = 0; i < ROOMS.length; i++) {
		if (need[ROOMS[i]] != null && need[ROOMS[i]] > mostneed) {
			mostneedname = ROOMS[i]; 
			mostneed = need[ROOMS[i]];
			isdefault = false; 
		}
	}
	if (isdefault) {
	}
	creep.memory.room = mostneedname; 
	return mostneedname; 
}

var moveToAndTransfer = function(creep, target){
	var tranresult = target.transfer(creep, RESOURCE_ENERGY); 
	if (tranresult == ERR_NOT_IN_RANGE) {
		creep.moveTo(target);
		return;
	} else if (tranresult == ERR_FULL) {
		//do nothing
	}
}

var roamingWorker = {
	run: function(creep) {
		shared.moveIntoRoom(creep);
    	var spawn = Game.spawns['Spawn1'];
    	
		if (creep.carry[RESOURCE_ENERGY] == 0) {
			var target = shared.getNonEmptyStorage(creep);
			if (target != null) {
    			moveToAndTransfer(creep, target);
    			return;
			}
		} 
		if (creep.memory.room == null || creep.memory.room == '') {
			creep.memory.room = findRoom(creep);
		}
		if (creep.room.name != creep.memory.room) {
			shared.moveBetweenRooms(creep, creep.memory.room);
			return; 
		}
		if (creep.room.name == creep.memory.room) {
			if (creep.carry[RESOURCE_ENERGY] == 0) {
				creep.memory.targetid = '';
				var refill = shared.getNonEmptyStorage(creep);
				if (refill != null) {
					shared.fillCreepFromContainer(creep, refill);
					return;
				} else  {
					shared.moveBetweenRooms(creep, spawn.room);
					return;
				}
				/*
			    var flags = creep.room.find(FIND_FLAGS);
                if (flags.length) {
                    var flag = flags[0];
                    if (flag != null && flag.room.name == creep.room.name) {
                        creep.moveTo(flag);		    
                        console.log("roamingworker here4");
                        return;
                    }
                } else {
                    creep.moveTo(20,20);
                }*/
			}
			if (creep.memory.targetid == null || creep.memory.targetid == '') {
				var needbuilding = creep.room.find(FIND_CONSTRUCTION_SITES);
				if (needbuilding.length > 0) {
					var target = creep.pos.findClosestByRange(needbuilding); 
				} 
				var needrepairs = creep.room.find(FIND_STRUCTURES, {
						filter: function(obj) {
							return (obj.hits < obj.hitsMax*0.8);
				}});
				if (needrepairs.length > 0) {
					var target = creep.pos.findClosestByRange(needrepairs);
				}
				
				if (target != null) {
					creep.memory.targetid = target.id; 
				} else {
					creep.memory.room = '';
					return;
				}
			} else {
				var target = Game.getObjectById(creep.memory.targetid);
				if (target == null) {
					creep.memory.room = '';
					creep.memory.targetid = '';
					return;
				}
				if (target.hits == target.hitsMax) {
				    creep.memory.targetid = '';
				    return;
				}
			}
			
			var workres = creep.build(target);
			if (workres == ERR_INVALID_TARGET) {
				workres = creep.repair(target);
			}
			if (workres == ERR_NOT_IN_RANGE) {
				creep.moveTo(target);
				return; 
			} else if (workres != 0) {
				creep.memory.targetid = '';
			}
		}
	}
}

module.exports = roamingWorker; 


//var index = array.indexOf(item);
//array.splice(index, 1);