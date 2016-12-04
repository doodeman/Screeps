var ROOMS = ['W18N66'];

var shared = require('shared');
var findTargetClaimer = function(creep) {
    var used = [];
    var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
    for (var i = 0; i < ROOMS.length; i++) {
        if (Game.rooms[ROOMS[i]] == null) {
            creep.memory.room = ROOMS[i];
            return;
        } 
    }
    for (var i = 0; i < claimers.length; i++) {
        if (claimers[i].id != creep.id) {
            used.push(claimers[i].memory.room); 
        }
    }
    var usedstr = "";
    for (var i = 0; i < used.length; i++) {
        usedstr += used[i] + " ";
    }
    for (var i = 0; i < ROOMS.length; i++) {
        if (used.indexOf(ROOMS[i]) == -1) {
            creep.memory.room = ROOMS[i];
            return;
        }
    }
    for (var i = 0; i < claimers.length; i++) {
        if (claimers[i].ticksToLive < 250) {
            creep.memory.room = claimers[i].memory.room;
            return;
        }   
    }
}

var roleClaimer = {
    run: function(creep) {
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS); 
        if (hostiles.length > 0) {
            creep.room.controller.activateSafeMode();
        }
        var spawn = Game.spawns['Spawn1'];
        creep.say(creep.memory.room);
        if (creep.memory.room == null || creep.memory.room == '') {
            findTargetClaimer(creep);
        }
        if (creep.room.name != creep.memory.room) {
            shared.moveBetweenRooms(creep, creep.memory.room);
            return;
        } else {
            var moveRes = creep.moveTo(creep.room.controller, {ignoreRoads: true});
            var reserve = creep.reserveController(creep.room.controller);
            //creep.say(reserve);
            return;
        }
    }, 
    spawnClaimer: function(max_claimers) {
        
        var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
        var emptyroom = false;
        var roomtargeters = {};
        for (var i = 0; i < ROOMS.length; i++) {
            var targeting = 0; 
            if (roomtargeters[ROOMS[i]] == null) {
                roomtargeters[ROOMS[i]] = 0;
            }
            for (var n = 0; n < claimers.length; n++) {
                if (claimers[i] != null && claimers[i].memory.room == ROOMS[i]) {
                    targeting += 1; 
                }
            }
            roomtargeters[ROOMS[i]] = targeting; 
            if (targeting  == 0) {
                emptyroom = true; 
                break;
            } 
        }
        if (claimers.length >= max_claimers*2) {
            return false; 
        }
        if (emptyroom) {
            return true;
        }
        var dying = 0;
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == 'claimer' && roomtargeters[creep.room.name] < 2) {
                if (creep.ticksToLive < 250) {
                    dying += 1;
                }
            }
        }
        if (dying > 0) {
            return true;
        }
        return false;
    },
    spawnClaimerNew: function(max_claimers) {
        var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer');
    }
}

module.exports = roleClaimer;