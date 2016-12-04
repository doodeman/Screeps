var ROOMS = ['W18N66', 'W19N67', 'W17N66'];

var ROOMSMAX = {
    'W18N66': 2,
    'W18N67': 0,
    'W17N66': 1,
    'W19N67': 1
}
var analyzer = require('enemyAnalyzer');

var shared = require('shared');


var findDepositTargetLongRange = function(creep) {
    var targets = creep.room.find(FIND_STRUCTURES, {
       filter: function(structure) {
           if (structure.structureType == STRUCTURE_LINK) {
                return true;
           }
       } 
    });
    if (targets.length == 0) {
        var targets = creep.room.find(FIND_STRUCTURES, {
           filter: function(structure) {
               if (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] < structure.storeCapacity) {
                    return true;
               }
           } 
        });
        if (targets.length == 0) {
            return -1;
        }
        return creep.pos.findClosestByRange(targets);;
    }
    var target = creep.pos.findClosestByRange(targets);
    
    return target;
}

var findTargetRoom = function(creep) {
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler');
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
        var targetingRoom = targets[ROOMS[i]];
        var roomMax = ROOMSMAX[ROOMS[i]];
        console.log("!!!!!!lrhauler target Targeting " + ROOMS[i] + " " + targetingRoom + " max " + roomMax);
        if (targets[ROOMS[i]] == null || targets[ROOMS[i]] < ROOMSMAX[ROOMS[i]]) {
            creep.memory.room = ROOMS[i];
            console.log("lrhauler returning " + ROOMS[i]);
            return;
        }
    }
}
var findLrHaulerTarget = function(creep) {
    if (creep.room.name != creep.memory.room) {
        return;
    }
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler');
    var targets = {}; 
    for (var i = 0; i < haulers.length; i++) {
        if (haulers[i].memory.target != null) {
            if (targets[haulers[i].memory.target] == null) {
                targets[haulers[i].memory.target] = 1; 
            } else {
                targets[haulers[i].memory.target] += 1; 
            }
        }
    }
    var containers = creep.room.find(FIND_STRUCTURES, { filter: function(obj) { return obj.structureType == STRUCTURE_CONTAINER; }})
    for (var i = 0; i < containers.length; i++) {
        if (typeof targets[containers[i].id] == 'undefined') {
            creep.memory.target = containers[i].id; 
            return containers[i];
        }
    }
    var min = _.min(Object.keys(targets), function (o) { return targets[o]; });
    if (containers.length == 0) {
        var storage = creep.room.find(FIND_STRUCTURES, { filter: function(obj) { return obj.structureType == STRUCTURE_STORAGE; }});
        creep.memory.target =  storage[0].id;
        return storage[0];
    }
    creep.memory.target = containers[0].id;
}

var roleLrhauler = {
    run: function(creep) {
        if(creep.memory.room == null || creep.memory.room == '' || (creep.memory.room == creep.memory.spawn)) {
            console.log("finding target room " + creep.name + " in room " + creep.room.name);
            console.log("memory room " + creep.memory.room + " memory spawn " + creep.memory.spawn);
            findTargetRoom(creep);
        }
        var items = creep.room.lookAt(creep.pos.x, creep.pos.y);
        var foundroad = false; 
        for (var i = 0; i < items.length; i++) {
            if (items[i].type == 'structure' && items[i].structure.structureType == STRUCTURE_ROAD) {
                foundroad = true;
                break;
            }
        }
        if (!foundroad) {
            //creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
        }
        var energy = creep.carry[RESOURCE_ENERGY];
        if (creep.memory.spawn == null) {
            var spawn = Game.spawns['Spawn1'];
        } else {
            var spawn = Game.spawns[creep.memory.spawn];
        }
        if (creep.memory.state == null || creep.memory.state == 'idle') {
            creep.memory.state = 'filling'; 
            creep.memory.target = '';
        }
        if (creep.memory.state == 'filling') {
            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
                creep.memory.state = 'returning';
                return;
            }
            if (creep.room.name != creep.memory.room) {
                shared.moveBetweenRooms(creep, creep.memory.room);
                return;
            }
            var dropped = creep.room.find(FIND_DROPPED_RESOURCES);
            var closestDrop = creep.pos.findClosestByRange(dropped);
            if (creep.pos.getRangeTo(closestDrop) < 3) {
                creep.pickup(closestDrop);
                return;
            }
            if (creep.memory.target == null || creep.memory.target == '') {
                var target = findLrHaulerTarget(creep); 
            } else {
                var target = Game.getObjectById(creep.memory.target);
            }
            var moveres = creep.moveTo(target, {reusePath: true}); 
            if (moveres < 0) {
                creep.say(moveres);
            }
            if (target == null) {
                creep.memory.state = 'idle';
                creep.memory.target = '';
                return;
            }
            target.transfer(creep, RESOURCE_ENERGY);
            return;
        }
        if (creep.memory.state == 'returning') {
            
            if (creep.energy == 0) {
                creep.memory.state = 'filling';
                creep.memory.target = '';
                return;
            }
            creep.memory.target = '';
            if (creep.energy == 0) {
                creep.memory.state = 'filling';
                creep.memory.target = '';
            }
            var roamingWorkers = creep.room.find(FIND_MY_CREEPS, {
                filter: function(obj) {
                    return obj.memory.role == 'roamingworker' && obj.carry[RESOURCE_ENERGY] == 0;
                }
            });
            if (roamingWorkers.length > 0) {
                creep.transfer(roamingWorkers[0], RESOURCE_ENERGY);
                creep.moveTo(roamingWorkers[0]);
                return;
            }
            if (creep.room.name !== spawn.room.name) {
                shared.moveBetweenRooms(creep, spawn.room.name);
                return;
            }
            if (creep.memory.target == null || creep.memory.target == '') {
                var target = findDepositTargetLongRange(creep);
                if (target == -1) {
                    creep.say('reterr');
                    creep.memory.state = 'idle';
                    return; 
                }
                creep.memory.target = target.id;
            } else {
                var target = Game.getObjectById(creep.memory.target);
            }
            var deposited = creep.carryCapacity;
            var tranResult = creep.transfer(target, RESOURCE_ENERGY);
            if (tranResult === 0) {
                Memory.lrmdeposited += deposited;
            }
            if (tranResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { ignoreRoads: true} );
                return; 
            } else if (tranResult == ERR_NOT_ENOUGH_RESOURCES) {
                creep.memory.state = 'idle';
                return;
            } else if (tranResult === ERR_FULL) {
                creep.memory.target = '';
                return; 
            } else if (tranResult < 0) {
                creep.say('berr' + tranResult);
                creep.memory.state = 'idle';
                return; 
            }
            if (creep.carry.energy == 0) {
                creep.memory.state = 'idle'; 
                creep.memory.target = '';
                return;
            }
        }
    }
}


module.exports = roleLrhauler; 