var ROOMS = ['W18N66', 'W17N67', 'W19N67'];
var analyzer = require('enemyAnalyzer');
var economyMonitor = require('economymonitor');

var MAXROOMS = {
    'W18N66': 2,
    'W18N67': 0,
    'W19N67': 1, 
    'W17N66': 1,
    'W19N68': 0,
    'W17N67': 2,
    'W18N65': 0,
    'W17N65': 2
}
var shared = require('shared');

var getRoomTarget = function(creep) {
    var target= economyMonitor.getLrMinerRoomTarget();
    creep.memory.room = target;
    console.log("lrminer getRoom Target  " + creep.memory.target);
    return target; 

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
            return ROOMS[i];
        }
    }
    
    return ROOMS[0];
}

var findTarget = function(creep) {
    /*
    If any source is not taken by a miner, take that source
    If no source is not taken, take source with least number of miners on it 
    If two or more sources share lowest number of miners, take source occupied by miner with shortest remaining lifespan
    */
    var used = {};
    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer');
    var sources = creep.room.find(FIND_SOURCES);
    for (var i =0; i < miners.length; i++) {
        var miner = miners[i]; 
        if (miner.memory.target != null) {
            if (used[miner.memory.target] != null) {
                used[miner.memory.target] += 1; 
            } else {
                used[miner.memory.target] = 1; 
            }
        }
    }
    
    //If any source is not taken by a miner, take that source
    for (var i = 0; i < sources.length; i++) {
        if (used[sources[i].id] == null) {
            creep.memory.state = 'mining'; 
            creep.memory.target = sources[i].id;
            return sources[i];
            return;
        }
    }
    
    
    var minKey = _.min(Object.keys(used), function (o) { return used[o]; });
    var minKeyValue = used[minKey];
    var minKeys = [];
    for (var key in used) {
        if (used[key] == minKeyValue) {
            minKeys.push(key);
        }
    }
    
    //If no source is not taken, take source with least number of miners on it 
    if (minKeys.length == 1) {
        creep.memory.state = 'mining'; 
        creep.memory.target = sources[i].id;
        return minKeys[0];
    }
    
    //If two or more sources share lowest number of miners, take source occupied by miner with shortest remaining lifespan
    var shortestTimeToLive = _.min(miners, function(miner) { return miner.ticksToLive; });
    if (shortestTimeToLive != null) {
        creep.memory.state = 'mining'; 
        creep.memory.target = shortestTimeToLive.memory.target; 
        return; 
    }
    
    creep.memory.state = 'mining'; 
    creep.memory.target = sources[0].id;
    return sources[0];
}

var longrangeminer = {
    needLrm: function() {
        var needrooms = [];

        for (var i = 0; i < ROOMS.length; i++) {
            var room = Game.rooms[ROOMS[i]]; 
            if (room != null) {
                var healthyHaulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer' && creep.memory.room == room.name && creep.ticksToLive > 150 );
                var neededForRoom =  MAXROOMS[room.name];
                if (healthyHaulers.length < neededForRoom) {
                    needrooms.push(room.name); 
                }
            }
        }
        return needrooms; 
    },
    run: function(creep) {
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: function(object) {
                return object.getActiveBodyparts(ATTACK) > 0;
            }
        });
        
        if (creep.memory.room == null || creep.memory.room == 'W19N66' || creep.memory.room == 'W18N67') {
            creep.memory.room = '';
        }
        if (hostiles.length) {
            analyzer.request(creep.room.name);
            creep.memory.underattack = true;
        } else {
            creep.memory.underattack = false;
        }
        if (creep.memory.room == creep.memory.spawn) {
            getRoomTarget(creep);
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
            creep.memory.target = '';
            return;
        }
        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            creep.memory.state = 'returning';   
        }
        if (creep.memory.state == 'idle') {
            if (creep.carry[RESOURCE_ENERGY] > 0) {
                creep.memory.state = 'returning';
            } else {
                creep.memory.state = 'mining';
            }
        }
        if (creep.memory.state == 'mining') {
            /*
            Mining state description: 
            If there are dropped resources in reach
                pick them up
            If not in target room
                move to target room 
                end
            Try to harvest target
            If not in range of target
                move to target

            */
            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
                creep.memory.state = 'returning';
                return;
            }
            var dropped = creep.room.find(FIND_DROPPED_RESOURCES);
            var closestDrop = creep.pos.findClosestByRange(dropped);
            if (creep.pos.getRangeTo(closestDrop) < 1) {
                creep.pickup(closestDrop);
                return;
            }
            if (typeof creep.memory.room === 'undefined' || creep.memory. room == '') {
                getRoomTarget(creep);
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
            if (target.room.name != creep.memory.room) {
                target = findTarget(creep);
                return;
            }
            if (target == null || target == -1) {
                creep.memory.target = '';
                return;
            }
            var harvestResult = creep.harvest(target);
            if (harvestResult == -1) {
                creep.memory.target = '';
                return;
            }
            if (harvestResult === -6) {
                return;
            }
            else if(harvestResult !== 0) {
                var moveresult = shared.moveByPath(creep, target);
                console.log(creep.name + " moveresult " + moveresult);
                if (moveresult === -11 || moveresult == -4 || moveresult == 0) {
                    //acceptable errors
                }
                else if (moveresult < 0) {
                    creep.memory.target = '';
                    findTarget(creep);
                    return;
                }
                return;
            }
        }
        if (creep.memory.state == 'returning') {
            /*
            Returning state
            If there are construction sites close by
                construct them

            */
            if (_.sum(creep.carry) == 0) {
                creep.memory.state = 'idle';
                return;
            }
            
            var targets = shared.getObjInRoomCriteria(
                creep.room.name, 
                'container', 
                function(structure) { return structure.structureType == STRUCTURE_CONTAINER; }); 
            if (targets.length == 0) {
                targets = shared.getObjInRoomCriteria(
                    creep.room.name, 
                    'container', 
                    function(structure) { return structure.structureType == STRUCTURE_STORAGE; }); 
            }
            if(targets.length > 0) {
                var target = creep.pos.findClosestByRange(targets);
                if (target.store[RESOURCE_ENERGY] == target.storeCapacity) {
                    var oldTarget = target; 
                    targets = _.filter(targets, (structure) => structure.storeCapacity - structure.store[RESOURCE_ENERGY] > creep.carryCapacity);
                    if (targets.length == 0) {
                        
                    } else {
                        target = creep.pos.findClosestByRange(targets); 
                        if (creep.pos.getRangeTo(target) > 5) { 
                            target = oldTarget; 
                        }
                    }
                }

                if (target.hits < target.hitsMax) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        shared.moveByPath(creep, target);
                    }
                    return;
                }
                if (target.store[RESOURCE_ENERGY] == target.storeCapacity) {
                    var sites = shared.getObjInRoomCriteria(creep.room.name, 'constructionsites', function(structure) { return true; }, FIND_CONSTRUCTION_SITES, 10); 
                    if (sites.length > 0) {
                        var target = creep.pos.findClosestByRange(sites);
                        if (target.pos.getRangeTo(creep.pos) < 30) {
                            var buildres = creep.build(target); 
                            if (buildres == ERR_NOT_IN_RANGE) {
                                shared.moveByPath(creep, target);
                                return;
                            } else if (buildres === 0) {
                                return;
                            } else {
                                creep.say('buerr' + buildres);
                                return;
                            }
                        }
                    }
                }
                var transferResult = creep.transfer(target, RESOURCE_ENERGY);
                if(transferResult === -9) {
                    shared.moveByPath(creep, target);
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
                            shared.moveByPath(creep, target);
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