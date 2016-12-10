var ROOMS = ['W18N66', 'W19N67', 'W17N66', 'W17N67', 'W18N65', 'W19N68'];

var analyzer = require('enemyAnalyzer');
var economymonitor = require('economymonitor');

var shared = require('shared');


var findDepositRoom = function(creep) {
    var spawnDistances = [];
    for (var spawnName in Game.spawns) {
        var spawn = Game.spawns[spawnName];
        spawnDistances.push({ name: spawnName, distance: Game.map.getRoomLinearDistance(creep.room.name, spawn.room.name)});
    }
    var min = Game.map.getRoomLinearDistance(creep.room.name, 'W19N66'); 
    var minname = "W19N66"; //default
    for (var i = 0; i < spawnDistances.length; i++) {
        //console.log(spawnDistances[i].name + " " + spawnDistances[i].distance + " " + minname + " " + min);
        if (spawnDistances[i].distance < min) {
            minname = spawnDistances[i].name; 
            min = spawnDistances[i].distance; 
        }
    }
    return minname; 
}

var findDepositTargetLongRange = function(creep) {

    var targets = shared.getObjInRoomCriteria(creep.room.name, "container", function(structure) { return structure.structureType == STRUCTURE_CONTAINER; });
    targets = targets.concat(shared.getObjInRoomCriteria(creep.room.name, "link", function(structure) { return structure.structureType == STRUCTURE_LINK; }));
    targets = targets.concat(shared.getObjInRoomCriteria(creep.room.name, "storage", function(structure) { return structure.structureType == STRUCTURE_STORAGE; }));
    
    if (targets.length == 0) {
        return -1;
    }
    return creep.pos.findClosestByRange(targets);
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
        var roomMax = economymonitor.getLrHaulerNeedForRoom(ROOMS[i]);
        //console.log("findlrhauler target roommax for " + ROOMS[i]+ ": " + roomMax);
        if (targets[ROOMS[i]] == null || targets[ROOMS[i]] < roomMax) {
            creep.memory.room = ROOMS[i];
            return;
        }
    }
    creep.memory.room = ROOMS[0];
    return;
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
    for (var i = 0; i < containers.length; i++) {
        var containerid = containers[i].id; 
        if(Memory.lrcontainers[containerid] != null) {
            var containerinfo = Memory.lrcontainers[containerid];
            if (targets[containerid] < containerinfo.haulersneeded) {
                creep.memory.target = containerid; 
                //console.log("LRHAULER TARGET returning " + containerid + " on basis of haulerneed");
                return;
            }
        }
    }
    if (containers.length == 0) {
        var storage = creep.room.find(FIND_STRUCTURES, { filter: function(obj) { return obj.structureType == STRUCTURE_STORAGE; }});
        if (storage.length == 0) {
            console.log(creep.name + " no targets found");
            return;
        }
        creep.memory.target =  storage[0].id;
        return storage[0];
    }
    creep.memory.target = containers[0].id;
}

var roleLrhauler = {
    needLrHauler: function() {
        var needrooms = [];
        for (var i = 0; i < ROOMS.length; i++) {
            var room = Game.rooms[ROOMS[i]]; 
            if (room != null) {
                var healthyHaulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler' && creep.memory.room == room.name && creep.ticksToLive > 150 );
    
                var neededForRoom =  economymonitor.getLrHaulerNeedForRoom(room.name);
                if (healthyHaulers.length < neededForRoom) {
                    needrooms.push(room.name); 
                }
            }
        }
        return needrooms; 
    },
    configuration: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    run: function(creep) {
        //console.log(creep.name + " " + creep.memory.room);
        if (creep.ticksToLive < 200) {
            //console.log(creep.name + " " + creep.ticksToLive);
        }
        if (creep.memory.room == null || creep.memory.room == 'W19N66' || creep.memory.room == 'W18N67') {
            creep.memory.room = '';
        }
        creep.say(creep.memory.room);
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: function(object) {
                return object.getActiveBodyparts(ATTACK) > 0;
            }
        });

        if (creep.pos.x == 29 && creep.pos.y == 5) {
            creep.move(LEFT);
        }

        if (hostiles.length) {
            console.log("miner setting underattack = true in " + creep.room.name);
            analyzer.request(creep.room.name);
            creep.memory.underattack = true;
        } else {
            creep.memory.underattack = false;
        }
        if(creep.memory.room == null || creep.memory.room == '' || (creep.memory.room == creep.memory.spawn) || creep.memory.room == 'W19N66') {
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
                creep.say(1);
                return;
            }
            var dropped = creep.room.find(FIND_DROPPED_RESOURCES);
            var closestDrop = creep.pos.findClosestByRange(dropped);
            if (creep.pos.getRangeTo(closestDrop) < 3) {
                creep.pickup(closestDrop);
                creep.moveTo(closestDrop);
                creep.say(2);
                return;
            }
            if (creep.memory.target == null || creep.memory.target == '') {
                var target = findLrHaulerTarget(creep); 
            } else {
                var target = Game.getObjectById(creep.memory.target);
            }
            if (target == null) {
                console.log(creep.name + " no target found in " + creep.room.name + " memory target " + creep.memory.target);
                return;
            }
            if (target.store[RESOURCE_ENERGY] < 500) {
                var others = target.room.find(FIND_STRUCTURES, { 
                    filter: function(obj) { 
                        if (obj.structureType == STRUCTURE_CONTAINER && obj.store[RESOURCE_ENERGY] > 1000) {
                            return true;
                        } 
                    }
                });
                if (others.length > 0) {
                    var closestother = creep.pos.findClosestByRange(others); 
                    var range = creep.pos.getRangeTo(closestother);
                    if (creep.pos.getRangeTo(closestother) < 10) {
                        creep.moveTo(closestother);
                        closestother.transfer(creep, RESOURCE_ENERGY);
                        return;
                    }
                }
                
            }
            if (creep.pos.getRangeTo(target) > 1) {
                var moveres = shared.moveByPath(creep, target); 
                if (moveres < 0) {
                    creep.say(moveres);
                }
            }
            if (target == null) {
                creep.memory.state = 'idle';
                creep.memory.target = '';
                creep.say(3);
                return;
            }
            economymonitor.registerContainer(target.id, creep.memory.spawn);
            target.transfer(creep, RESOURCE_ENERGY);
            creep.say(4);
            return;
        }
        if (creep.memory.state == 'returning') {
            
            if (creep.carry[RESOURCE_ENERGY] == 0) {
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
            if (creep.memory.depositRoom == null || creep.memory.depositRoom == '') {
                creep.memory.depositRoom = findDepositRoom(creep);
                console.log(creep.name + " in " + creep.room.name + " deposit room is " + creep.memory.depositRoom);
            }
            if (creep.room.name == 'W18N67') {
                creep.memory.depositRoom == 'W18N67'; 
            }
            if (creep.room.name == 'W19N66') {
                creep.memory.depositRoom = 'W19N66';
            }
            if (creep.room.name !== creep.memory.depositRoom) {

                shared.moveBetweenRooms(creep, creep.memory.depositRoom);
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
                shared.moveByPath(creep, target);
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