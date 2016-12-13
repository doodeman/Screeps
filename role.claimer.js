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
        var hostiles = shared.getObjInRoomCriteria(
            creep.room.name, 'hostiles', 
            function(obj) { return true; }, 
            FIND_HOSTILE_CREEPS, 
            5);
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
            if (creep.room.name == 'W18N65') {
                var claim = creep.claimController(creep.room.controller);
            }
            var reserve = creep.reserveController(creep.room.controller);
            //creep.say(reserve);
            return;
        }
    }, 
    claimerNeeded: function(rooms) {
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i]; 
            var healthyClaimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.room == room && creep.ticksToLive > 150 );
            if (healthyClaimers.length == 0) {
                return room; 
            }
        }
        return null; 
    }
}

module.exports = roleClaimer;