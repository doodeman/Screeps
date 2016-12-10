

var shared = require('shared');

var findTargetHaulerNew = function(creep) {
    //console.log("findtargethaulernew " + creep.name + " in room " + creep.room.name);
    
    var targets = shared.getObjInRoomCriteria(creep.room.name, "container", function(structure) { return structure.structureType == STRUCTURE_CONTAINER; });
    targets = _.filter(targets, (structure) => structure.store[RESOURCE_ENERGY] > (creep.carryCapacity - creep.carry[RESOURCE_ENERGY]));
    if (targets.length > 0) {
        var otherTargets = []; 
        var others = creep.room.find(FIND_MY_CREEPS, { filter: function(other) { return other.memory.role == 'hauler'; }});
        for (var i = 0; i < others.length; i++) {
            otherTargets.push(others[i].memory.target);
        }
        for (var i = 0; i < targets.length; i++) {
            var index = otherTargets.indexOf(targets[i].id);
            if (index == -1) {
                var target = targets[i];
                creep.memory.target = target.id; 
                return target; 
            }
        }
        var target = creep.pos.findClosestByRange(targets);
        creep.memory.target = target.id; 
        return target; 
    }
    var targets = creep.room.find(FIND_STRUCTURES, {
        filter: function(structure) {
            if (structure.isActive() && (structure.structureType === STRUCTURE_STORAGE) && (structure.store[RESOURCE_ENERGY] > creep.carryCapacity)) {
                return true;
            }
        }
    });
    if (targets.length > 0) {
        var target = creep.pos.findClosestByRange(targets);
        creep.memory.target = target.id; 
        return target; 
    }
    return null;
}

var findDepositTargetHauler = function(creep) {
    var targets = shared.getObjInRoomCriteria(creep.room.name, 'allExtensionsAndSpawns', function(structure) 
        { 
            return (
                structure.structureType == STRUCTURE_EXTENSION 
                || structure.structureType == STRUCTURE_SPAWN) 
                || structure.structureType == STRUCTURE_TOWER
                && structure.isActive();
    });
    targets = _.filter(targets, (structure) => structure.energy < structure.energyCapacity);


    if (targets == null || targets.length == 0) {
        var targets = shared.getObjInRoomCriteria(creep.room.name, 'towers', function(structure) { return structure.structureType == STRUCTURE_TOWER; });
        targets = _.filter(targets, (structure) => structure.energy < structure.energyCapacity);
        if (targets == null || targets.length == 0) {
            var target = creep.room.find(FIND_STRUCTURES, {
                filter: function(structure) {
                    if(structure.structureType === STRUCTURE_STORAGE) {
                        return true; 
                    }
                }
            })[0];
        }
        
        if (target == null) {
            return;
        }
        creep.memory.depositTarget = target.id;
        return target;
        return -1;
    }
    var target = creep.pos.findClosestByRange(targets);
    creep.memory.depositTarget = target.id;
    return target;
}


var roleHauler = {
    run: function(creep) {
        creep.say(creep.memory.spawn);
        for (res in creep.carry) {
            if (res != RESOURCE_ENERGY) {
                creep.drop(res);
            }
        }
        creep.memory.room = creep.room.name;
        //console.log(creep.name + " target " + creep.memory.target); 
        //creep.memory.target = '';
        if (creep.room.name == 'W19N66') {
            //creep.memory.target = '';
        }
        if (creep.memory.spawn == null) {
            creep.memory.spawn = creep.room.name;
        }
        if (creep.memory.room == null) {
            creep.memory.room = creep.room.name;
        }
        if (creep.memory.state == null) {
            creep.memory.state = 'idle';
        }
        if (creep.room.name != creep.memory.room) {
            creep.memory.target = '';
            shared.moveBetweenRooms(creep, creep.memory.room);
            return;
        }
        if (creep.carry[RESOURCE_ENERGY] == 0) {
            creep.memory.state = 'load';
            creep.memory.target = '';
            creep.memory.depositTarget = '';
        }
        if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'unload';
            creep.memory.target = '';
            creep.memory.depositTarget = '';
        }
        if (creep.memory.state == null || creep.memory.state == '' || creep.memory.state == 'idle') {
            creep.memory.state = 'load';
            creep.memory.target = '';
            creep.memory.depositTarget = '';
        }
        if (creep.memory.target == null) {
            creep.memory.target = '';
            creep.memory.depositTarget = '';
        }
        if (creep.memory.state == 'load') {
            load(creep);
        }
        if (creep.memory.state == 'unload') {
            unload(creep);
        }
    }
}

var load = function(creep) {
    var dropped = creep.room.find(FIND_DROPPED_RESOURCES, { 
        filter: function(res) { 
            return res.resourceType === 'energy'; 
        }
    });
    if (dropped.length > 0) {
        var closestDrop = creep.pos.findClosestByRange(dropped);
        creep.moveTo(closestDrop);
        creep.pickup(closestDrop);
        return;
    }
    
    if (creep.memory.room == creep.room.name && (creep.memory.target == null || creep.memory.target == '')) {
        findTargetHaulerNew(creep);
    }
    var target = Game.getObjectById(creep.memory.target);
    if (target == null || target.store[RESOURCE_ENERGY] == 0) {
        creep.memory.target = '';
        return;
    }
    creep.moveTo(target);
    var tranResult = target.transfer(creep, RESOURCE_ENERGY);
    if (tranResult === ERR_NOT_IN_RANGE) {
        return; 
    } else if (tranResult == ERR_NOT_ENOUGH_RESOURCES) {
        return;
    } else if (tranResult === ERR_FULL) {
        creep.memory.state = 'unload';
        creep.memory.target = '';
        creep.memory.depositTarget = '';
        return; 
    } else if (tranResult < 0) {
        creep.say('berr' + tranResult);
        creep.memory.state = 'load';
        creep.memory.target = '';
        creep.memory.depositTarget = '';
        return; 
    }
    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.state = 'unload'; 
        creep.memory.target = '';
        creep.memory.depositTarget = '';
        
        return;
    }
}
var unload = function(creep) {
    if(creep.memory.depositTarget == null || creep.memory.depositTarget == '') {
        findDepositTargetHauler(creep);
    }
    var target = Game.getObjectById(creep.memory.depositTarget);
    if (target == null) {
        creep.say('notarget');
        return;
    }
    var tranResult = creep.transfer(target, RESOURCE_ENERGY);
    
    if (tranResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
        return; 
    } else if (tranResult == ERR_NOT_ENOUGH_RESOURCES) {
        creep.memory.depositTarget = '';
        creep.memory.state = 'load';
        creep.memory.target = '';
        creep.memory.depositTarget = '';
        return;
    } else if (tranResult === ERR_FULL) {
        creep.memory.depositTarget = '';
        creep.memory.target = '';
        creep.memory.depositTarget = '';
        return; 
    } else if (tranResult < 0) {
        creep.say('berr' + tranResult);
        creep.memory.state = 'load';
        creep.memory.target = '';
        creep.memory.depositTarget = '';
        return; 
    }
    if (creep.carry.energy == 0) {
        creep.memory.state = 'load'; 
        creep.memory.depositTarget = '';
        return;
    }
}

module.exports = roleHauler;
