var ROOMS = ['W17N66'];
var moveBetweenRooms = function(creep, destination) {
    if (creep.pos.x == 0) {
        creep.move(RIGHT);
        return;
    }
    if (creep.pos.x == 49) {
        creep.move(LEFT);
        return;
    }
    if (creep.pos.y == 0) {
        creep.move(BOTTOM);
        return;
    }
    if (creep.pos.y == 49) {
        creep.move(TOP);
        return;
    }
    var route = Game.map.findRoute(creep.room, destination);
    if(route.length > 0) {
        for(var i = 0; i < route.length; i++) {
        }
        var exit = creep.pos.findClosestByPath(route[0].exit, {ignoreRoads: true });
        var moveres = creep.moveTo(exit);
        return;
    }
}

var getTarget = function(creep) {
    var used = []; 
    var explorers = _.filter(Game.creeps, (creep) => creep.memory.role == 'explorer');
    for (var i = 0; i < explorers.length; i++) {
        if (explorers[i].memory.room != null) {
            used.push(explorers[i].memory.room); 
        }
    }
    for (var i = 0; i < ROOMS.length; i++) {
        if (used.indexOf(ROOMS[i]) == -1) {
            creep.memory.room = ROOMS[i];
            return;
        }
    }
    creep.memory.room = ROOMS[0];
}

var flagname = 'Target';
var explorer = {
    /*
    states: moving, idle, surveying
    */
    run: function(creep) {
        creep.memory.room = 'W17N66';
        if (creep.memory.room == null || creep.memory.room == '') {
            getTarget(creep);
        }
        if (creep.room.name != creep.memory.room) {
            moveBetweenRooms(creep, creep.memory.room);
            return;
        }
        
        var targets = creep.room.find(FIND_HOSTILE_CREEPS); 
        if (targets.length > 0) {
            var target = creep.pos.findClosestByRange(targets);
            creep.moveTo(target);
            creep.attack(target);
        } else {
            var flags = creep.room.find(FIND_FLAGS);
            if (flags.length) {
                var flag = flags[0];
                if (flag != null && flag.room.name == creep.room.name) {
                    creep.moveTo(flag);
                    return;
                }
            }
        }
        
    }
}

module.exports = explorer; 