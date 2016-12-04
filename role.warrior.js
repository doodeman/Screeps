
var analyzer = require('enemyAnalyzer');

var ROOMS = ['W18N66', 'W18N67', 'W19N67'];
var ROOMSMAX = {
    'W18N66': 3,
    'W18N67': 0,
    'W19N67': 0
};
var rallyX = 45;
var rallyY = 35;
var wallX = 45; 
var wallY = 35;

var shared = require('shared');
var findTargetRoom = function(creep) {
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'warrior');
    var targets = {};
    console.log("warrior priority room " + creep.memory.priorityRoom + " warriors count " + haulers.length);
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
        var inroom = targets[ROOMS[i]];
        if (inroom == null) {
            inroom = 0;
        }
        var roommax = ROOMSMAX[ROOMS[i]];
        console.log("room " + ROOMS[i] + " inroom " + inroom + " roomax " + roommax);
        if (inroom  < roommax) {
            creep.memory.room = ROOMS[i];
            console.log("warrior room ret " + ROOMS[i]);
            return;
        }
    }
    console.log("warrior room default ret " +  ROOMS[1]);
    creep.memory.room = ROOMS[1];
}

var FLAGNAME = 'Flag1';
var roleWarrior = {
    run: function(creep, go) {
        creep.memory.room = 'W18N66';
        var warriors = _.filter(Game.creeps, (creep) => (creep.memory.role == 'warrior' || creep.memory.role == 'healer') && creep.memory.underattack == true);
        
        if (warriors.length) {
            creep.memory.priorityRoom = warriors[0].room.name;
        } else {
            creep.memory.priorityRoom = '';
        }
        if (creep.memory.room == null || creep.memory.room == '') {
            findTargetRoom(creep);
        }
        var spawn = Game.spawns['Spawn1'];
        if (creep.ticksToLive < 1400 && creep.pos.getRangeTo(spawn) < 2 && spawn.energy > 100) {
            return;
        }
        if (creep.room.name == spawn.room.name && creep.ticksToLive < 500) {
            creep.moveTo(spawn);
            spawn.renewCreep(creep);
            return;
        } 
        if (creep.memory.state == null || creep.memory.state == '') {
            creep.memory.state = 'idle';
        }
        
        if (creep.memory.state === 'idle') {
            if (go) {
                creep.memory.state = 'attack';
                return;
            } else {
                creep.memory.state = 'waiting';
            }
        }
        
        if (creep.memory.state == 'waiting') {
            if(creep.room.name !== spawn.room.name) {
                shared.moveBetweenRooms(creep, spawn.room);
            } else if (creep.ticksToLive < 500 && spawn.pos.findInRange(FIND_MY_CREEPS, 1, {filter: function(object) { return object.memory.role == 'warrior' || object.memory.role == 'healer'; }}).length < 4) {
                creep.moveTo(spawn);
                if (creep.pos.getRangeTo(spawn) < 2) {
                    spawn.renewCreep(creep);
                }
            } else if(go) {
                creep.memory.state = 'attack';
                return;
            } else {
                creep.moveTo(rallyX, rallyY);
            }
        }
        
        if (creep.memory.state == 'attack') {
            
            
            
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            });
            if (targets.length == 0) {
                var targets = creep.room.find(FIND_HOSTILE_CREEPS, {
                    filter: function(object) {
                        return object.getActiveBodyparts(ATTACK) || object.getActiveBodyparts(RANGED_ATTACK) || object.getActiveBodyparts(HEAL) > 0;
                    }
                });
                if (targets.length == 0) {
                    creep.memory.underattack = false;
                    if (creep.name == 'warrior1553') {
                        //creep.memory.underattack = true;
                    }
                    var targets = creep.room.find(FIND_HOSTILE_CREEPS);
                } else {
                    console.log("warrior setting underattack to true in " + creep.room.name);
                    analyzer.request(creep.room.name);
                    creep.memory.underattack = true; 
                }
            }
            if (creep.memory.priorityRoom != null && creep.memory.priorityRoom != '' && creep.room.name != creep.memory.priorityRoom) {
                console.log("Helping comrade!");
                shared.moveBetweenRooms(creep, creep.memory.priorityRoom);
                return;
            }
            if (creep.room.name !== creep.memory.room) {
                creep.say('notinarea');
                shared.moveBetweenRooms(creep, creep.memory.room);
                return;
            } else {
                //creep.say('inarea');
            }
            if (targets.length == 0) {
                var flags = creep.room.find(FIND_FLAGS);
                if (flags.length) {
                    var flag = flags[0];
                    if (flag != null && flag.room.name == creep.room.name) {
                        creep.moveTo(flag);
                        return;
                    }
                } else {
                    creep.moveTo(24,24);

                }
                
            } else {
                var target = creep.pos.findClosestByRange(targets);
                var attackresult = creep.attack(target);
                var attackresult = creep.rangedAttack(target);
                creep.moveTo(target);
            }
	   }
    }
}

module.exports = roleWarrior; 