var AVOID = ['W20N68']

 var shared = {

 	getObjInRoomCriteria(room, name, filterfunc) {
 		if (Memory.objCache == null) {
 			Memory.objCache = {};
 		}
 		var updated = false; 
 		if (Memory.objCache[name] == null || Memory.objCache[name][name] == null) {
			Memory.objCache[name] = {}; 
			Memory.objCache[name][name] = {}; 
			Memory.objCache[name].lastUpdated = Game.time; 
			updated = true; 
		}
		var sinceLast = Game.time - Memory.objCache[name].lastUpdated;
		if (sinceLast > 300) {
			Memory.objCache[name] = {}; 
			Memory.objCache[name][name] = {}; 
			Memory.objCache[name].lastUpdated = Game.time; 
			updated = true; 
		}
		if (Memory.objCache[name][name][room] == null 
			|| Object.keys(Memory.objCache[name][name][room]).length == 0) {
			this.updateObjectInRoomCriteria(room, name, filterfunc);
			updated = true; 
		}
		var objects = []; 
		for (var i = 0; i < Memory.objCache[name][name][room].length; i++) {
			var object = Game.getObjectById(Memory.objCache[name][name][room][i]);
			if (object != null) {
				objects.push(object); 
			}
		}
		return objects;
 	},

 	updateObjectInRoomCriteria(room, name, filterfunc) {
		var targets = Game.rooms[room].find(FIND_STRUCTURES, {
	        filter: filterfunc
	    });
	    if (Memory.objCache[name][name][room] == null) {
	    	Memory.objCache[name][name][room] = [];
	    }
	    for (var i = 0; i < targets.length; i++) {
	    	var target = targets[i]; 
	    	Memory.objCache[name][name][room].push(target.id);  
	    } 	
 	},

 	getContainersInRoom(room) {
 		return shared.getObjInRoomCriteria(room, "container", function(structure) { return structure.structureType == STRUCTURE_CONTAINER; })
 	},
 	getPath: function(x1, y1, x2, y2, room) {
        var path = new RoomPosition(x1, y1, room).findPathTo(new RoomPosition(x2, y2, room), {ignoreRoads: true});
        for (var i = 0; i < path.length; i++) {
            Game.rooms[room].createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
        }
	},
	
	findPath: function(creep,target) {
		//console.log(creep.name + " in " + creep.room.name + " pathfinding");
	    //console.log(creep.name + " finding path in " + creep.room.name);
	    creep.say('pathfinding');
	    PathFinder.use(false);
    	var path = creep.pos.findPathTo(target, { avoid: this.getRoomEdge(creep.room.name), maxOps: 500 });
    	//var path = creep.pos.findPathTo(target, {maxOps: 500 });
    	PathFinder.use(true);
        creep.memory.path = path;
        
        if (creep.memory._move != null && creep.memory._move.dest != null && creep.memory._move.room != creep.room.name) {
            creep.memory_move = null;
        }
        return path;
	},
	
	moveByPath: function(creep, target) {
		if(!creep.memory.path || creep.memory.path.length == 0) {
			var path = shared.findPath(creep,target)
	    }
	    if (creep.memory.path.length == 0) {
	    	this.moveIntoRoom(creep);
	    	var path = shared.findPath(creep,target);
	    	return;
	    }
	    if (creep.pos.getRangeTo(target) > 1) {
	        creep.room.lookAt(creep.memory.path[0].x, creep.memory.path[0].y).forEach(function(lookObject) {
    	        if (lookObject.type == LOOK_CREEPS) {
    	            console.log(creep.name + " Here, generating new path");
    	            var path = shared.findPath(creep, target);
    	            return;
    	        }
    	    });
	    }
	     
	    var moveres = creep.moveTo(creep.memory.path[0].x, creep.memory.path[0].y);
	    //console.log(creep.name + " in room " + creep.room.name + " moving to " + creep.memory.path[0].x + " " + creep.memory.path[0].y + " path: " + shared.logPath(creep.memory.path) + " to target " + target);
	    if (moveres == 0) {
	        creep.memory.path.shift();
	    } else {
	        //console.log(creep.name + " in room " + creep.room.name + " moveres " + moveres + " moving to " + creep.memory.path[0].x + " " + creep.memory.path[0].y);
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
	    var route = Game.map.findRoute(creep.room, destination, {
	    	routeCallback(roomName, fromRoomName) {
	    		if (AVOID.indexOf(roomName) != -1) {
	    			return Infinity; 
	    		}
	    	}
	    });
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
	            
	        }
	        return;
	    }
	},

	getMultiroomPathLength: function(x1, y1, room1, x2, y2, room2) {
		if (room1 == room2) {
			return shared.getPointToPointLength(x1, y2, x2, y2, room1);
		}

		var route = Game.map.findRoute(Game.rooms[room1], Game.rooms[room2]);
		var routestr = "Route from " + room1 + " to " + room2 + "\n"; 
		for (var i = 0; i < route.length; i++) {
			routestr += "Room " + i + ": " + route[i].room + " exit: " + shared.exitNames[route[i].exit] + "\n";
		}
		var steps = [];
		if (route.length > 1) {
			steps.push({
				entry: -1,
				exit: route[0].exit, 
				room: room1
			});
			for (var i = 0; i < route.length; i++) {
				if (i > 0 && i != route.length-1) {
					steps.push({
						entry: shared.getOppositeExit(route[i-1].exit),
						exit: route[i].exit, 
						room: route[i].room
					});
				}
				if (i == 0) {
					if(route[i+1] == null) {
						var rexit = -1; 
					} else {
						var rexit = route[i+1].exit;
					}
					steps.push({
						entry: shared.getOppositeExit(steps[0].exit), 
						exit: rexit, 
						room: route[i].room
					});
				}
				if (i == route.length - 1) {
					steps.push({
						entry: shared.getOppositeExit(route[i].exit), 
						exit: -1, 
						room: route[i].room
					});
				} 
			}
			shared.logMultiRoomPath(steps);
			var length = 0;
			var exitX = -1; 
			var exitY = -1;
			for (var i = 0; i < steps.length; i++) {
				
				var yChanged = false; 
				if (exitY == 49) {
					exitY = 0; 
					yChanged = true; 
				}  
				if (exitY == 0 && !yChanged) {
					exitY = 49; 
				}
				var xChanged = false; 
				if (exitX == 49) {
					exitX = 0; 
					xChanged = true; 
				}
				if (exitX == 0 && !xChanged) {
					exitX = 49;
				}
				if (i == 0) {
					//Start position to first exit length
					var obj = shared.getExitToPointLength(x1, y1, room1, steps[i].exit); 
					length += obj.len;
					exitX = obj.exitX; 
					exitY = obj.exitY;
					continue;
				}
				if (i == steps.length -1) {
					//last exit to end position length
					
					length += shared.getPointToPointLength(exitX, exitY, x2, y2, steps[i].room);
					continue; 
				} 
				//exit to exit length
				var obj = shared.getExitToPointLength(exitX, exitY, steps[i].room, steps[i].exit);
				length += obj.len;
				exitX = obj.exitX; 
				exitY = obj.exitY; 
			}
			return length; 
		} else {
			var obj1 = shared.getExitToPointLength(x1, y1, room1, route[0].exit);
			var exitX = obj1.exitX; 
			var exitY = obj1.exitY; 
			var yChanged = false; 
			if (exitY == 49) {
				exitY = 0; 
				yChanged = true; 
			}  
			if (exitY == 0 && !yChanged) {
				exitY = 49; 
			}
			var xChanged = false; 
			if (exitX == 49) {
				exitX = 0; 
				xChanged = true; 
			}
			if (exitX == 0 && !xChanged) {
				exitX = 49;
			}
			var obj2 = shared.getPointToPointLength(x2, y2, exitX, exitY, room2);
			return obj1.len + obj2;
		} 
	},

	getPointToPointLength: function(x1, y1, x2, y2, room) {
		//console.log("getPointToPointLength params: " + x1 + " " + y1 + " " + x2 + " " + y2 + " " + room);
		var startpos = new RoomPosition(x1, y1, room); 
		var endpos = new RoomPosition(x2, y2, room);
		var len = startpos.findPathTo(endpos).length;
		//console.log("getPointToPointLength returning " + len);
		return len;
	},	

	getExitToPointLength: function(x, y, room, exit) {
	    var pos = new RoomPosition(x, y, room);
	    var newExit = pos.findClosestByRange(exit);
	    var path = pos.findPathTo(newExit); 
		var retobj = { len: path.length, exitX: path[path.length-1].x, exitY: path[path.length-1].y };
		//console.log("retobj: " + retobj.len + " exitX: " + retobj.exitX + " exitY: " + retobj.exitY);
		return retobj;
	},

	getExitToExitLength: function(entry, exit, room) {
		return 1;
		
	},

	logMultiRoomPath: function(path) {
		var ret = "Route: "; 
		for (var i = 0; i < path.length; i++) {
			ret += "\nroom: " + path[i].room + " entry: " + shared.exitNames[path[i].entry] + " exit: " + shared.exitNames[path[i].exit]; 
		}
		console.log(ret);
	},

	getOppositeExit: function(exitName) {
		switch (exitName) {
			case FIND_EXIT_RIGHT: 
				return FIND_EXIT_LEFT;
			case FIND_EXIT_LEFT: 
				return FIND_EXIT_RIGHT; 
			case FIND_EXIT_BOTTOM: 
				return FIND_EXIT_TOP; 
			case FIND_EXIT_TOP: 
				return FIND_EXIT_BOTTOM;
		}
	},

	getPathLength: function(x1, y1, x2, y2, room) {
		PathFinder.use(false);
    	var path = new RoomPosition(x1, y1, room).findPathTo(new RoomPosition(x2, y2, room), { avoid: this.getRoomEdge(creep), maxOps: 500 });
    	PathFinder.use(true);
    	return path.length; 
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
	exitNames: {
		/*
		 FIND_EXIT_TOP: 1,
	    FIND_EXIT_RIGHT: 3,
	    FIND_EXIT_BOTTOM: 5,
	    FIND_EXIT_LEFT: 7,
		*/
		1: 'FIND_EXIT_TOP', 
		3: 'FIND_EXIT_RIGHT', 
		5: 'FIND_EXIT_BOTTOM',
		7: 'FIND_EXIT_LEFT'
	},
	getRoomEdge: function(roomname) {
	    if (Memory.roomEdges != null) {
	        return Memory.roomEdges; 
	    } else {
    		var avoid = []; 
    		for (var i = 0; i < 50; i++) {
    			avoid.push(new RoomPosition(i, 0, roomname));
    			avoid.push(new RoomPosition(i, 49, roomname));
    			avoid.push(new RoomPosition(0, i, roomname));
    			avoid.push(new RoomPosition(49, i, roomname));
    		}
    		Memory.roomEdges = avoid;
    		for (var i = 0; i < avoid.length; i++) {
    		    avoid[i].roomName = roomname;
    		}
	        return avoid; 
	    }
	}
}

module.exports = shared;