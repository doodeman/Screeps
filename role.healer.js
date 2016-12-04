var ROOMS = ['W18N66', 'W18N67', 'W19N67'];
var ROOMSMAX = {
    'W18N66': 2,
    'W18N67': 0,
    'W19N67': 0
};
var rallyX = 27;
var rallyY = 12;

var shared = require('shared');

var findTargetRoom = function(creep) {
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'healer');
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
}


var roleHealer = {
    run: function(creep, go) {
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: function(object) {
                return object.getActiveBodyparts(ATTACK) > 0;
            }
        });
        if (hostiles.length) {
            console.log("healer setting underattack = true in " + creep.room.name);
            creep.memory.underattack = true;
        } else {
            creep.memory.underattack = false;
        }
        var warriors = _.filter(Game.creeps, (creep) => (creep.memory.role == 'warrior' || creep.memory.role == 'healer') && creep.memory.underattack == true);
        if (warriors.length) {
            creep.memory.priorityRoom = warriors[0].room.name;
        } else {
            creep.memory.priorityRoom = '';
        }
        var spawn = Game.spawns['Spawn1'];
        if(creep.memory.room == null || creep.memory.room == '') {
            findTargetRoom(creep);
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
            } else if (creep.ticksToLive < 750 && spawn.pos.findInRange(FIND_MY_CREEPS, 1, {filter: function(object) { return object.memory.role == 'warrior' || object.memory.role == 'healer'; }}).length < 4) {
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
            if (hostiles.length == 0) {
                if (creep.memory.priorityRoom != null && creep.memory.priorityRoom != '' && creep.room.name != creep.memory.priorityRoom) {
                    console.log("Helping comrade!");
                    shared.moveBetweenRooms(creep, creep.memory.priorityRoom);
                    return;
                }
                if (creep.room.name !== creep.memory.room) {
                    creep.say('notinarea');
                    shared.moveBetweenRooms(creep, creep.memory.room);
                    return;
                }
            }
             else {
                //creep.say('inarea');
            }
            
            var targets = creep.room.find(FIND_MY_CREEPS, {
                filter: function(object) {
                    return (object.hits < object.hitsMax);
                }
            });
            if (targets.length > 0) {
                creep.say('healing!');
                var target = creep.pos.findClosestByRange(targets);
                var healresult = creep.heal(target);
                if (healresult == ERR_NOT_IN_RANGE) {
                    var healresult = creep.rangedHeal(target);
                }
                var moveres = creep.moveTo(target);
                return;
            }
            var warriors = creep.room.find(FIND_MY_CREEPS, {
                filter: function(obj) {
                    return obj.memory.role == 'warrior';
                }
            });
            if (warriors.length > 0) {
                var closest = creep.pos.findClosestByRange(warriors); 
                creep.moveTo(closest); 
                return;  
            }
            var flags = creep.room.find(FIND_FLAGS);
            if (flags.length) {
                var flag = flags[0];
                if (flag != null && flag.room.name == creep.room.name) {
                    creep.moveTo(flag);
                    return;
                }
            }
            //noone is hurt, move to staging
            if(creep.pos.getRangeTo(20, 20) > 5) {
                var maximum = 3;
                var minimum = 0;
                var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
                var moveres = creep.moveTo(20 + randomnumber , 20 + randomnumber);
            }
            
        }
    }
}

module.exports = roleHealer;