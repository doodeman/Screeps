var shared = require('shared');

var roleWallWorker = {
	run: function(creep) {
		if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
			creep.memory.state = 'working'; 
		} 
		if (creep.carry[RESOURCE_ENERGY] == 0) {
			creep.memory.state = 'filling';
		}
		if(creep.memory.state == 'filling') {
        	this.filling(creep);
        } else {
        	this.working(creep); 
        }
	},
	findTarget: function(creep) {
	    console.log("Finding wall worker repair target"); 
		var targets = shared.getObjInRoomCriteria(creep.room.name, 'structures', function(structure) { return true; }, FIND_STRUCTURES, 5);
        var lowhealthtargets = _.filter(targets, 
            (structure) => (
                ((structure.structureType == STRUCTURE_WALL) || (structure.structureType == STRUCTURE_RAMPART))
                && (structure.hits < 1000)));
	    if (lowhealthtargets.length > 0) {
	        var target = creep.pos.findClosestByRange(lowhealthtargets); 
	        creep.memory.target = target.id; 
	        console.log("returning target!");
	        return target;
	    }
        var targets = _.filter(targets, 
        	(structure) => (
        		((structure.structureType == STRUCTURE_WALL) || (structure.structureType == STRUCTURE_RAMPART))
		        && (structure.hits < 500000)));
        if (targets.length > 0) {
        	var target = creep.pos.findClosestByRange(targets); 
        	creep.memory.target = target.id; 
        	return target; 
        }
        return null; 
	},
	working: function(creep) {
		if (creep.memory.target == null || creep.memory.target == '') {
			var target = this.findTarget(creep); 
		}
		if (target == null || creep.memory.target != null || creep.memory.target != '') {
			target = Game.getObjectById(creep.memory.target);
			console.log("got target object " + target);
		} else {
		    creep.memory.target = '';
			creep.say('Notarget'); 
			var sites = shared.getObjInRoomCriteria(creep.room.name, 'wallconstructionsites', function(site) { return site.structureType == STRUCTURE_RAMPART || site.structureType == STRUCTURE_WALL; }, FIND_CONSTRUCTION_SITES, 10);
			if (sites.length > 0) {
			    var target = creep.pos.findClosestByPath(sites); 
			    creep.moveTo(target); 
			    creep.build(target);
			    return;
			}
			return; 
		}
		var result = creep.repair(target);
		console.log("repair result " +result);
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
	},
	filling: function(creep) {
		var nearlyfull = shared.getFullStorage(creep);
        if (nearlyfull == -1) {
            var flags = creep.room.find(FIND_FLAGS);
            if (flags.length) {
                var flag = flags[0];
                if (flag != null && flag.room.name == creep.room.name) {
                    creep.moveTo(flag);         
                    return;
                }
            } else {
                creep.moveTo(29, 32);
            }
            return;
        }
        if (creep.energy == creep.carryCapacity) {
            creep.memory.state = 'working';
            return;
        }
        if (target != -1) {
            if (nearlyfull != null && nearlyfull != -1) {
                var target = nearlyfull;
            } else {
                var target = shared.getFullStorage(creep);
            }
            if (target == -1) {
                return;
            }
        }
        if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
            var tranResult = target.transfer(creep, RESOURCE_ENERGY);
        } else {
            var tranResult = target.transferEnergy(creep); 
        }
        if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'working';
            return;
        }
        if (tranResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return; 
        } else if (tranResult === ERR_FULL) {
            creep.memory.state = 'working';
            return; 
        } else if (tranResult < 0) {
            creep.say('berr' + tranResult);
            creep.memory.state = 'working';
            return; 
        }
        if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
            creep.memory.state = 'working'; 
            return;
        }
    }
}

module.exports = roleWallWorker;