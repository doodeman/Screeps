var ROOMS = ['W18N66', 'W19N67', 'W17N66'];

var analyzer = require('enemyAnalyzer');

var MAXROOMS = {
    'W18N66': 2,
    'W18N67': 0,
    'W19N67': 1, 
    'W17N66': 1
}
var shared = require('shared');

var getRoomTarget = function(creep) {
    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer');
    var targets = {}; 
    for (var i = 0; i < miners.length; i++) {
        if (miners[i].memory.room != null) {
            if (targets[miners[i].memory.room] == null) {
                targets[miners[i].memory.room] = 1; 
            } else {
                targets[miners[i].memory.room] += 1; 
            }
        }
    }
    for (var i = 0; i < ROOMS.length; i++) {
        if (typeof targets[ROOMS[i]] == 'undefined') {
            creep.memory.room = ROOMS[i]; 
            
            return ROOMS[i];
        }
    }
    for (var i = 0; i < ROOMS.length; i++) {
        if (MAXROOMS[ROOMS[i]] > targets[ROOMS[i]]) {
            creep.memory.room = ROOMS[i]; 
            
            return;
        }
    }
    
    return ROOMS[0];
}

var findTarget = function(creep) {
    var used = [];
    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer');
    var sources = creep.room.find(FIND_SOURCES);
    for (var i =0; i < miners.length; i++) {
        used.push(miners[i].memory.target);
    }
    for (var i = 0; i < sources.length; i++) {
        if (used.indexOf(sources[i].id) == -1) {
            creep.memory.state = 'mining'; 
            creep.memory.target = sources[i].id;
            return sources[i];
            return;
        }
    }
    creep.memory.state = 'mining'; 
    creep.memory.target = sources[0].id;
    return sources[0];
}

var longrangeminer = {
    run: function(creep) {
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: function(object) {
                return object.getActiveBodyparts(ATTACK) > 0;
            }
        });
        if (hostiles.length) {
            console.log("miner setting underattack = true in " + creep.room.name);
            analyzer.request(creep.room.name);
            creep.memory.underattack = true;
        } else {
            creep.memory.underattack = false;
        }
        if (creep.memory.room == null || creep.memory.room == '') {
            getRoomTarget(creep);
        }
        var spawn = Game.spawns['Spawn1'];
        if (creep.memory.state == null || creep.memory.state == '' || creep.memory.state == 'harvesting') {
            creep.memory.state = 'idle';
            creep.memory.target = '';
        }
        if (creep.memory.state == 'noviable') {
            creep.memory.state = 'idle';
            creep.memory.room = '';
            return;
        }
        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'returning';   
        } else {
            creep.memory.state = 'mining';
        }
        if (creep.memory.state == 'idle') {
            if (creep.carry[RESOURCE_ENERGY] > 0) {
                creep.memory.state = 'returning';
            } else {
                creep.memory.state = 'mining';
            }
        }
        if (creep.memory.state == 'mining') {
            var dropped = creep.room.find(FIND_DROPPED_RESOURCES);
            var closestDrop = creep.pos.findClosestByRange(dropped);
            if (creep.pos.getRangeTo(closestDrop) < 1) {
                creep.pickup(closestDrop);
                return;
            }
            if (typeof creep.memory.room === 'undefined' || creep.memory. room == '' || creep.memory.target == null || creep.memory.target == '') {
                findTarget(creep);
            }
            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
                creep.memory.state = 'returning';
                return;
            }
            if (creep.room.name != creep.memory.room) {
                shared.moveBetweenRooms(creep, creep.memory.room);
                return;
            }
            if (creep.memory.target == null || creep.memory.target == '') {
                var target = findTarget(creep);
            } else {
                var target = Game.getObjectById(creep.memory.target);
            }
            if (target == null || target == -1) {
                creep.memory.target = '';
                return;
            }
            if (creep.memory.room != creep.memory.room) {
                creep.memory.target = '';
                if (creep.room.name == creep.memory.room) {
                    creep.moveTo(20,20);
                    return;
                }
            }
            var harvestResult = creep.harvest(target);
            if (harvestResult == -1) {
                creep.memory.target = '';
                creep.memory.room = '';
                creep.memory.state = 'idle';
                return;
            }
            if (harvestResult === -6) {
                creep.memory.target = '';
                creep.memory.state = 'idle';
                return;
            }
            else if(harvestResult !== 0) {
                var moveresult = creep.moveTo(target);
                creep.say(moveresult);
                if (moveresult === -7) {
                }
                if (moveresult !== 0 && moveresult !== -11) {
                }
                if (moveresult === -2) {
                    creep.memory.target = '';
                    creep.memory.room = ''; 
                    findTarget(creep);
                    creep.moveTo(20,20);
                    return;
                }
                return;
            }
        }
        if (creep.memory.state == 'returning') {
            if (_.sum(creep.carry) == 0) {
                creep.memory.state = 'idle';
                return;
            }
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    if (structure.structureType == STRUCTURE_CONTAINER) {
                        return true;  
                    }
                }
            });
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (sites.length > 0) {
                var target = creep.pos.findClosestByRange(sites);
                if (target.pos.getRangeTo(creep.pos) < 5) {
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
            }
            if(targets.length > 0) {
                var target = creep.pos.findClosestByRange(targets);
                if (target.hits < target.hitsMax) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                    return;
                }
                var transferResult = creep.transfer(target, RESOURCE_ENERGY);
                if(transferResult === -9) {
                    creep.moveTo(target);
                    return;
                }
                if(transferResult === 0) {
                    return;
                }
                if(transferResult === -8) {
                    var targets = creep.room.find(FIND_STRUCTURES);
                    var target = creep.pos.findClosestByRange(targets);
                    if (target.hits < target.hitsMax) {
                        if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                        }
                    }
                    return;
                }
            } else {
                if (targets == null) {
                    creep.say("targets null");
                    creep.memory.state = 'idle';
                    return;
                } 
                if (targets.length === 0) {
                    creep.say("tlen 0");
                    creep.memory.state = 'idle';
                    return;
                }
            }
            
            return;
        }
    }
}
module.exports = longrangeminer;