
var analyzer = require('enemyAnalyzer');

var ROOMS = ['W18N66', 'W18N67', 'W19N67'];
var ROOMSMAX = {
    'W18N66': 2,
    'W18N67': 2,
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
        
        if (inroom  < roommax) {
            creep.memory.room = ROOMS[i];
            
            return;
        }
    }
    
    creep.memory.room = ROOMS[1];
}

var FLAGNAME = 'Flag1';
var roleWarrior = {
    run: function(creep, go) {
        var spawn = Game.spawns[creep.memory.spawn]; 
        if (creep.memory.room == spawn.room.name) {
            creep.memory.room = '';
        }
        var warriors = _.filter(Game.creeps, (creep) => creep.memory.underattack == true);
        if (warriors.length > 0) {
            
            creep.memory.priorityRoom = warriors[0].room.name;
        } else {
            
            if (go && creep.memory.priorityRoom != null && creep.memory.priorityRoom != '') {
                console.log("priorityroom " + creep.memory.priorityRoom);
                if (Game.rooms[creep.memory.priorityRoom] == null) {
                    shared.moveBetweenRooms(creep, creep.memory.priorityRoom);
                    return;
                }
                var targets = Game.rooms[creep.memory.priorityRoom].find(FIND_HOSTILE_CREEPS, {
                    filter: function(object) {
                        return object.getActiveBodyparts(ATTACK) || object.getActiveBodyparts(RANGED_ATTACK) || object.getActiveBodyparts(HEAL) > 0;
                    }
                });
                
                if (targets != null && targets.length > 0) {

                } else {
                    
                    creep.memory.priorityRoom = null;
                }
            }
            
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
                return;
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
            
            
            
            var targets = creep.room.find(FIND_HOSTILE_STRUCTURES, {
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
                    var targets = creep.room.find(FIND_HOSTILE_CREEPS);
                    if (targets.length == 0) {
                        var targets = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: function(obj)  { return obj.structureType != STRUCTURE_CONTROLLER; }});
                    }
                } else {
                    
                    analyzer.request(creep.room.name);
                    creep.memory.underattack = true; 
                }
                
            }
            if (targets.length > 0) {
                var target = new RoomPosition(18, 9, creep.room.name).findClosestByRange(targets);
                var attackresult = creep.attack(target);
                var attackresult = creep.rangedAttack(target);
                var targetX = target.pos.x; 
                var targetY = target.pos.y; 
                if (targetX == 49) targetX -= 1; 
                if (targetX == 0) targetX += 1; 
                if (targetY == 0) targetY += 1; 
                if (targetY == 49) targetY -= 1;
                
                var targetPos = new RoomPosition(targetX, targetY, target.room.name);
                shared.moveByPath(creep, targetPos);
                return;
            }
            if (creep.memory.priorityRoom != null && creep.memory.priorityRoom != '' && creep.room.name != creep.memory.priorityRoom) {
                
                shared.moveBetweenRooms(creep, creep.memory.priorityRoom);
                
                return;
            }
            if (creep.memory.priorityRoom != null && creep.memory.priorityRoom != '' && creep.room.name != creep.memory.priorityRoom) {
                shared.moveBetweenRooms(creep, creep.memory.priorityRoom);
                
                return;
            } else if ((creep.memory.priorityRoom == null || creep.memory.priorityRoom == '') && (creep.room.name !== creep.memory.room)) {
                creep.say('notinarea');
                shared.moveBetweenRooms(creep, creep.memory.room);
                
                return;
            } else {
                var flags = creep.room.find(FIND_FLAGS);
                if (flags.length) {
                    var flag = flags[0];
                    if (creep.pos.getRangeTo(flag) > 5) {
                        if (flag != null && flag.room.name == creep.room.name) {
                            shared.moveByPath(creep, flag);
                            
                            return;
                        }
                    }
                } else {
                    creep.moveTo(24,24);
                }
            }
            
	   }
    }
}

module.exports = roleWarrior; 