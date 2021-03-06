
var shared = require('shared');
ROOM = 'W18N65';
var roleTargetedBuilder = {
	run: function(creep) {
	    console.log("Targeted builder in room " + creep.room.name + " going to " + ROOM);
	    shared.moveIntoRoom(creep);
	    creep.memory.room = ROOM;
		//creep.say('TARGETEDBUILDER');
    	var spawn = Game.spawns['Spawn1'];
		if (creep.carry[RESOURCE_ENERGY] == 0) {
			var refill = shared.getNonEmptyStorage(creep);
			if (refill != null) {
				shared.fillCreepFromContainer(creep, refill);
				
				return;
			} 
			if (creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
			var target = shared.getNonEmptyStorage(creep);
				if (target != null) {
				    
					if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
		                var tranResult = target.transfer(creep, RESOURCE_ENERGY);
		            } else {
		                var tranResult = target.transferEnergy(creep); 
		            }
		            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
						
		                return;
		            }
		            if (tranResult === ERR_NOT_IN_RANGE) {
		                creep.moveTo(target);
						
		                return; 
		            } else if (tranResult < 0) {
		                creep.say('berr' + tranResult);
						
		                return; 
	                }
				}
			}
		} else {
			if (creep.room.name != ROOM) {
			    shared.moveBetweenRooms(creep, ROOM);
			    
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

	            var sites = shared.getObjInRoomCriteria(creep.room.name, 'constructionsites', function(structure) { return true; }, FIND_CONSTRUCTION_SITES, 10);
	            
	            if (sites.length > 0) {
	            	var target = creep.pos.findClosestByRange(sites);
	            	var buildres = creep.build(target); 
		            if (buildres == ERR_NOT_IN_RANGE) {
		                creep.moveTo(target);
		                return;
		            } else if (buildres === 0) {
		                return;
		            } else {
		                creep.say('buerr' + buildres);
		                return;
		            }
	            }
	            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
	            	var moveres = shared.moveByPath(creep, creep.room.controller);
                    return;
                }
                

	            var targets = shared.getObjInRoomCriteria(creep.room.name, 'structures', function(structure) { return true; });
	            
                var targets = _.filter(targets, 
                	(structure) => (
                		((structure.structureType == STRUCTURE_WALL) || (structure.structureType == STRUCTURE_RAMPART))
				        && (structure.hits < 1000000)));

                if (targets.length > 0) {
                	var target = creep.pos.findClosestByRange(targets);
                } else {
                	creep.say('No target');
                	return;
                }
                var result = creep.repair(target);
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                    return; 
                } else if (result == 0) {
                    return;
                } else if (result == ERR_NOT_ENOUGH_RESOURCES) {
                    creep.memory.state = 'filling';
                    return;
                } else if (result < 0) {
                    creep.say(result);
                    creep.memory.state = 'filling';
                    return;
                } 
		        //var moveres = shared.moveByPath(creep, target); 
		        var moveres = creep.moveTo(target, { reusePath: true });
		        creep.transfer(target, RESOURCE_ENERGY);
		    }
			
		}
	}
}

module.exports = roleTargetedBuilder;