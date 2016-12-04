
var shared = require('shared');

var findTargetHaulerNew = function(creep) {
    var targets = creep.room.find(FIND_STRUCTURES, {
        filter: function(structure) {
            if (structure.isActive() && (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE)) {
                return true;
            }
        }
    });
    var used = [];
    for(var name in Game.creeps) {
        var othercreep = Game.creeps[name];
        if (othercreep.memory.role == 'hauler' && othercreep.room.name == creep.room.name) {
            if (othercreep.memory.target != null) {
                used.push(othercreep.memory.target);
            }
        }
    }
    var targetsstr = ""; 
    for (var i = 0; i < targets.length; i++) {
        targetsstr += targets[i] + " in room " + targets[i].room.name ; 
    }
    for (var i = 0; i < targets.length; i++) {
        if (used.indexOf(targets[i].id) === -1) {
            creep.memory.target = targets[i].id;
            break;
            return;
        }
    }
    return;
}

var findDepositTargetHauler = function(creep) {
    if (creep.memory.target == '583a18c5433c29bf7a5140a2') {
        var target = creep.room.find(FIND_STRUCTURES, {
            filter: function(structure) {
                if(structure.structureType === STRUCTURE_STORAGE) {
                    return true; 
                }
            }
        })[0];
        creep.memory.depositTarget = target.id;
        return target;
        return -1;
    }
    var homecontainer = Game.getObjectById(creep.memory.target);
    //if (!creep.memory.target == '583a18c5433c29bf7a5140a2') {
        var targets = creep.room.find(FIND_STRUCTURES, {
           filter: function(structure) {
                if (structure.isActive() && (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION)) {
                   if (structure.energy < structure.energyCapacity) {
                       return true; 
                   }
                }
                if (structure.structureType == STRUCTURE_TOWER && structure.energy < structure.energyCapacity) {
                    return true;
                }
           } 
        });
    //}
    if (targets == null || targets.length == 0) {
        var target = creep.room.find(FIND_STRUCTURES, {
            filter: function(structure) {
                if(structure.structureType === STRUCTURE_STORAGE) {
                    return true; 
                }
            }
        })[0];
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
        
        if (creep.memory.spawn == null) {
            creep.memory.spawn = creep.room.name;
        }
        if (creep.memory.room == null) {
            creep.memory.room = creep.room.name;
        }
        if (creep.memory.state == null) {
            creep.memory.state = 'idle';
        }
        creep.memory.room = creep.memory.spawn;
        if (creep.room.name != creep.memory.room) {
            creep.memory.target = '';
            shared.moveBetweenRooms(creep, creep.memory.room);
            return;
        }
        if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'unload';
        }
        if (creep.memory.state == null || creep.memory.state == '' || creep.memory.state == 'idle') {
            creep.memory.state = 'load';
        }
        if (creep.memory.target == null) {
            creep.memory.target = '';
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
    var dropped = creep.room.find(FIND_DROPPED_RESOURCES);
    if (dropped.length > 0) {
        var closestDrop = creep.pos.findClosestByRange(dropped);
        creep.moveTo(closestDrop);
        creep.pickup(closestDrop);
        //console.log("hauler ret 1 room " + creep.room.name + " target room " + creep.memory.room);;
        return;
    }
    
    if (creep.memory.room == creep.room.name && (creep.memory.target == null || creep.memory.target == '')) {
        findTargetHaulerNew(creep);
    }
    var target = Game.getObjectById(creep.memory.target);
    if (target == null) {
        creep.say('tnotfound');
        creep.memory.target = '';
        //console.log("hauler ret 2 room " + creep.room.name + " target room " + creep.memory.room);;
        return;
    }
    creep.moveTo(target);
    var tranResult = target.transfer(creep, RESOURCE_ENERGY);
    if (tranResult === ERR_NOT_IN_RANGE) {
        //console.log("hauler ret 3 room " + creep.room.name + " target room " + creep.memory.room);;
        return; 
    } else if (tranResult == ERR_NOT_ENOUGH_RESOURCES) {
        //console.log("hauler ret 4 room " + creep.room.name + " target room " + creep.memory.room);;
        return;
    } else if (tranResult === ERR_FULL) {
        creep.memory.state = 'unload';
        //console.log("hauler ret 5 room " + creep.room.name + " target room " + creep.memory.room);;
        return; 
    } else if (tranResult < 0) {
        creep.say('berr' + tranResult);
        creep.memory.state = 'load';
        //console.log("hauler ret 6 room " + creep.room.name + " target room " + creep.memory.room);;
        return; 
    }
    if (creep.carry.energy === creep.carryCapacity) {
        creep.memory.state = 'unload'; 
        //console.log("hauler ret 7 room " + creep.room.name + " target room " + creep.memory.room);;
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
        return;
    } else if (tranResult === ERR_FULL) {
        creep.memory.depositTarget = '';
        return; 
    } else if (tranResult < 0) {
        creep.say('berr' + tranResult);
        creep.memory.state = 'load';
        return; 
    }
    if (creep.carry.energy == 0) {
        creep.memory.state = 'load'; 
        creep.memory.depositTarget = '';
        return;
    }
}

module.exports = roleHauler;