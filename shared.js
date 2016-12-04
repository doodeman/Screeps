/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('shared');
 * mod.thing == 'a thing'; // true
 */

 var shared = {

 	getPath: function(x1, y1, x2, y2, room) {
        var path = new RoomPosition(x1, y1, room).findPathTo(new RoomPosition(x2, y2, room), {ignoreRoads: true});
        for (var i = 0; i < path.length; i++) {
            Game.rooms[room].createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
        }
	},

	moveByPath: function(creep, target) {

		if(!creep.memory.path || creep.memory.path.length == 0) {
			PathFinder.use(false);
	    	var path = creep.pos.findPathTo(target, { avoid: this.getRoomEdge(creep) });
	    	PathFinder.use(true);
	        creep.memory.path = path;
	    }
	    if (creep.memory.path.length == 0) {
	    	this.moveIntoRoom(creep);
	    	return;
	    }
	    var moveres = creep.moveTo(creep.memory.path[0].x, creep.memory.path[0].y);
	    if (moveres == 0) {
	        creep.memory.path.shift();
	    } else {
	    }
	    return moveres;
	},

	logPath: function(path) {
		var pathstr = ""; 
		for (var i = 0; i < path.length; i++) {
			pathstr + "Step " + i + "- x: " + path[i].x + " y: " + path[i].y + " ";
		}
		return pathstr; 
	},

	moveIntoRoom: function(creep) {
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
	},

	moveBetweenRooms: function(creep, destination) {
	    if (creep.pos.x == 0) {
	        creep.move(RIGHT);
	        creep.memory._move = null;
	        return;
	    }
	    if (creep.pos.x == 49) {
	        creep.move(LEFT);
	        creep.memory._move = null;
	        return;
	    }
	    if (creep.pos.y == 0) {
	        creep.move(BOTTOM);
	        creep.memory._move = null;
	        return;
	    }
	    if (creep.pos.y == 49) {
	        creep.move(TOP);
	        creep.memory._move = null;
	        return;
	    }
	    var route = Game.map.findRoute(creep.room, destination);
	    creep.say(destination);
	    
	    if(route.length > 0) {
	        for(var i = 0; i < route.length; i++) {
	        }
	        if (creep.memory.destination == null || creep.memory.destionation != '') {
	            var exit = creep.pos.findClosestByPath(route[0].exit);
	        }
	        //var moveres = creep.moveTo(exit, {ignoreRoads: true, reusePath: true});
	        var moveres = shared.moveByPath(creep, exit);
	        if (creep.memory.role == 'lrhauler') {
	            //console.log(creep.name + " moveresult " + moveres + " room " + creep.room.name + " targetroom " + creep.memory.room);
	        }
	        return;
	    }
	},

	moveRandomDir: function (creep) {
	    var dirs = [TOP,
	        TOP_RIGHT,
	        RIGHT,
	        BOTTOM_RIGHT,
	        BOTTOM,
	        BOTTOM_LEFT,
	        LEFT,
	        TOP_LEFT];
	    var min = 0; 
	    var max = dirs.length;
	    creep.move(dirs[Math.floor(Math.random() * (max - min)) + min]);
	}, 

	adjacent: function(obj) {
	    var adjacent = 0;
	    for (var x = 0; x < 3; x++) {
	        for (var y = 0; y < 3; y++) {
	            var lookat = obj.room.lookAt(obj.pos.x-1 + x, obj.pos.y-1 + y);
	            for(var i = 0; i < lookat.length; i++) {
	                if ((lookat[i].type === 'terrain' && lookat[i].terrain === 'wall') || (lookat[i].type == 'creep')) {
	                    adjacent += 1;
	                } 
	            }
	            //if (lookat > 0) {
	             //   adjacent += 1; 
	            //}
	        }
	    }
	    return adjacent;
	},


	getFullStorage: function(creep) {
	    var storage = creep.room.find(FIND_STRUCTURES, { 
	        filter: (structure) => { return structure.structureType == STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 1500; }
	    });
	    if (storage.length > 0) {
	        return storage[0];
	    }
	    var nearlyFull = creep.room.find(FIND_STRUCTURES, {
	       filter: (structure) => {
	           if (structure.structureType == STRUCTURE_CONTAINER) {
	               return (structure.store[RESOURCE_ENERGY] > 1000);
	           }
	       } 
	    });
	    if (nearlyFull.length) {
	        return creep.pos.findClosestByRange(nearlyFull);
	    }
	    return -1;
	}, 
	getNonEmptyStorage: function(creep) {
	    var viable = creep.room.find(FIND_STRUCTURES, {
	        filter: (structure) => {
	            if (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) {
	                return (structure.store[RESOURCE_ENERGY] > 299);  
	            }
	        }
	    });
	    if (viable.length == 0) {
	        creep.memory.state = 'idle';
	        return null;
	    }
	    return creep.pos.findClosestByRange(viable);
	},
	fillCreepFromContainer: function(creep, target) {
		if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
            var tranResult = target.transfer(creep, RESOURCE_ENERGY);
        } else {
            var tranResult = target.transferEnergy(creep); 
        }
        if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
            return;
        }
        if (tranResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return; 
        } else if (tranResult < 0) {
            creep.say('berr' + tranResult);
            return; 
        }
	},
	errorCodes: {
		'0': 'OK',
		'-1': 'ERR_NOT_OWNER',
		'-2': 'ERR_NO_PATH',
		'-4': 'ERR_BUSY', 
		'-7': 'ERR_INVALID_TARGET', 
		'-11': 'ERR_TIRED', 
		'-12': 'ERR_NO_BODYPART'
	},
	errorNames: {
		'OK' : 0, 
		'ERR_NOT_OWNER': -1,
		'ERR_NO_PATH': -2,
		'ERR_BUSY': -4,
		'ERR_INVALID_TARGET': -7,
		'ERR_TIRED': -11,
		'ERR_NO_BODYPART': 12
	},
	getRoomEdge: function(creep) {
		var avoid = []; 
		for (var i = 0; i < 50; i++) {
			avoid.push(new RoomPosition(i, 0, creep.room.name));
			avoid.push(new RoomPosition(i, 49, creep.room.name));
			avoid.push(new RoomPosition(0, i, creep.room.name));
			avoid.push(new RoomPosition(49, i, creep.room.name));
		}
		return avoid;
	}
}

module.exports = shared;