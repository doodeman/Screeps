var ROOMS = ['W19N66', 'W18N66', 'W18N67'];
var ROOMSMAX = {
    'W19N66': 1,
    'W18N66': 1,
    'W18N67': 1
};
var shared = require('shared');




var findTargetRoom = function(creep) {
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer');
    var targets = {};
    for (var i = 0; i < haulers.length; i++) {
        if (haulers[i].memory.room != null) {
            if (targets[haulers[i].memory.room] == null) {
                targets[haulers[i].memory.room] = 1; 
            } else {
                targets[haulers[i].memory.room] += 1; 
            }
        }
    }
    for (var i = 0; i < ROOMS.length; i++) {
        if (targets[ROOMS[i]] == null || targets[ROOMS[i]] < ROOMSMAX[ROOMS[i]]) {
            creep.memory.room = ROOMS[i];
            return;
        }
    }
}

var roleRepairer = {

    /** @param {Creep} creep **/
    run: function(creep) {
        //creep.say(creep.memory.state);
        var spawn = Game.spawns['Spawn1'];
        
        if (creep.ticksToLive < 1400 && creep.pos.getRangeTo(spawn) < 2 && spawn.energy > 100) {
            return;
        }
        if (creep.room.name == spawn.room.name && creep.ticksToLive < 500) {
            creep.moveTo(spawn);
            spawn.renewCreep(creep);
            return;
        } 
        if (creep.room.name != spawn.room.name && creep.ticksToLive < 150) {
            return shared.moveBetweenRooms(creep, spawn.room.name);
        }
        //creep.say(creep.memory.state);
        if(creep.memory.state == 'idle') {
            if (creep.carry < creep.carryCapacity) {
                creep.memory.state = 'filling';
            } else {
                creep.memory.state = 'repairing';
            }
            return;
        }
        if (creep.memory.room == null || creep.memory.room == '') {
            findTargetRepairer(creep);
        }
        if (creep.memory.state == 'filling'){
            if (creep.energy == creep.carryCapacity) {
                creep.memory.state = 'repairing';
                return;
            }
            var target = shared.getNonEmptyStorage(creep);
            if (target == null) {
                console.log("no nonempty");
                return;
            }
            if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
                var tranResult = target.transfer(creep, RESOURCE_ENERGY);
            } else {
                var tranResult = target.transferEnergy(creep); 
            }
            if (tranResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
                return; 
            } else if (tranResult === ERR_FULL) {
                creep.memory.state = 'repairing';
                return; 
            } else if (tranResult < 0) {
                creep.say('berr' + tranResult);
                creep.memory.state = 'idle';
                return; 
            }
            if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
                creep.memory.state = 'building'; 
                return;
            }
            return; 
        }
        if (creep.memory.state = 'repairing') {
            if (creep.energy == 0) {
                creep.memory.state = 'filling';
                return;
            }
            if (creep.room.name != creep.memory.room) {
                shared.moveBetweenRooms(creep, creep.memory.room); 
                return;
            }
            if (creep.memory.target == null || creep.memory.target == '') {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.hitsMax - structure.hits) > 500) && structure.structureType == STRUCTURE_CONTAINER;
                    }
                });
                if (targets.length > 0) {
                    var target = creep.pos.findClosestByRange(targets);
                    creep.memory.target = target.id; 
                    return; 
                }
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.hitsMax - structure.hits) > 100;    
                    }
                });
                if (targets.length == 0) {
                    return;
                }
                var target = creep.pos.findClosestByRange(targets);
                creep.memory.target = target.id; 
                return; 
            } else {
                var target = Game.getObjectById(creep.memory.target);
                if (target.hits == target.hitsMax) {
                    creep.memory.target = '';
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
                
            }
            
        }
    }
};

module.exports = roleRepairer;