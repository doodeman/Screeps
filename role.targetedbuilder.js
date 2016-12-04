
var shared = require('shared');
ROOM = 'W18N67';
var roleTargetedBuilder = {
	run: function(creep) {
    	var spawn = Game.spawns['Spawn1'];
    	//console.log(creep.name + " energy " + creep.carry[RESOURCE_ENERGY] + " in room " + creep.room.name + " target room " + ROOM + " fatigue " + creep.fatigue);
		if (creep.carry[RESOURCE_ENERGY] == 0) {
			var refill = shared.getNonEmptyStorage(creep);
			if (refill != null) {
				shared.fillCreepFromContainer(creep, refill);
				//console.log("refilling in room " + creep.room.name); 
				return;
			}
			if (creep.room.name != spawn.room.name) {
				shared.moveBetweenRooms(creep, spawn.room.name);
				//console.log("moving to spawn room in room  " + creep.room.name);
				return; 
			} else {
				if (creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
					var target = shared.getNonEmptyStorage(creep);
					if (target != null) {
					    
    					if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
    		                var tranResult = target.transfer(creep, RESOURCE_ENERGY);
    		            } else {
    		                var tranResult = target.transferEnergy(creep); 
    		            }
    		            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
							//console.log("transferring1 in room  " + creep.room.name + " tranresult " + tranResult);
    		                return;
    		            }
    		            if (tranResult === ERR_NOT_IN_RANGE) {
    		                creep.moveTo(target);
							//console.log("transferring2 in room  " + creep.room.name + " tranresult " + tranResult);
    		                return; 
    		            } else if (tranResult < 0) {
    		                creep.say('berr' + tranResult);
							//console.log("transferring3 in room  " + creep.room.name + " tranresult " + tranResult);
    		                return; 
		                }
					}
				}
			}
		} else {
			if (creep.room.name != ROOM) {
				    shared.moveBetweenRooms(creep, ROOM);
				    //console.log("moving between rooms in room " + creep.room.name)
				    return;
			} else {
				/*
				var moveres = shared.moveByPath(creep, creep.room.controller);
			    console.log("moving to controller in room " + creep.room.name + " moveres " + shared.errorCodes[moveres]);
			    if (moveres == ERR_NO_PATH) {
			    	creep.path = null; 
			    	creep._move = null; 
					var moveres = creep.moveTo(spawn);
					console.log("second attempt moveres: " + shared.errorCodes[moveres]);
			    }
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                }
                return;
                */
		        var target = creep.pos.findClosestByRange(creep.room.find(FIND_STRUCTURES, {
		            filter: function(structure) {
		                if(((structure.structureType === STRUCTURE_EXTENSION) || (structure.structureType === STRUCTURE_SPAWN)) && structure.energyCapacity > structure.energy) {
		                    return true; 
		                }
		            }
		        }));
		        if (target == null) {
		            var moveres = shared.moveByPath(creep, creep.room.controller);
				    //console.log("moving to controller in room " + creep.room.name + " moveres " + shared.errorCodes[moveres]);
				    if (moveres == ERR_NO_PATH) {
				    	creep.path = null; 
				    	creep._move = null; 
						var moveres = creep.moveTo(spawn);
						//console.log("second attempt moveres: " + shared.errorCodes[moveres]);
				    }
                    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    }
                    return;
		        }
		        var moveres = shared.moveByPath(creep, target); 
		        creep.transfer(target, RESOURCE_ENERGY);
		    }
			
		}
	}
}

module.exports = roleTargetedBuilder;