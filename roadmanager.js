var roadmanager = {
	roads: {
		'W19N68': {
			'container-W19N67': {
				x1: 14,
				y1: 38,
				x2: 28,
				y2: 48
			}
		},
		'W19N67': {
			'W19N68-W18N67': {
				x1: 27,
				y1: 1, 
				x2: 48,
				y2: 18
			},
			'container-W18N67': {
				x1: 25,
				y1: 12, 
				x2: 48,
				y2: 18
			}
		},
		'W18N67': {
			'W19N67-storage': {
				x1: 1,
				y1: 9, 
				x2: 14,
				y2: 18
			},
			'W19N67-storage-2': {
				x1: 1, 
				y1: 20, 
				x2: 14,
				y2: 18
			}
		},
		'W18N67': {
			'W18N66-storage': {
				x1: 7,
				y1: 48,
				x2: 14, 
				y2: 18
			},
			'W18N66-storage-2': {
				x1: 27, 
				y1: 48, 
				x2: 14,
				y2: 18
			},
			'W17N67-storage': {
				x1: 48,
				y1: 38,
				x2: 14,
				y2: 18
			}
		},
		'W17N67': {
			'containers-W18N67': {
				x1: 25, 
				y1: 7, 
				x2: 1,
				y2: 30
			},
			'containers-point1': {
				x1: 25,
				y1: 7, 
				x2: 21,
				y2: 24
			},
			'point1-W18N67': {
				x1: 21, 
				y1: 24,
				x2: 1, 
				y2: 37
			}
		},
		'W18N66': {
			'W18N67-W19N66': {
				x1: 7,
				y1: 1, 
				x2: 1,
				y2: 10
			},
			'W19N67-container1': {
				x1: 1, 
				y1: 10, 
				x2: 28,
				y2: 6
			},
			'W19N67-container2': {
				x1: 1, 
				y1: 10, 
				x2: 38,
				y2: 29
			},
			'W19N67-W17N67': {
				x1: 1,
				y1: 10, 
				x2: 48,
				y2: 10
			},
			'W19N67-W18N65': {
				x1: 1, 
				y1: 10,
				x2: 8,
				y2: 48
			}
		},
		'W18N65': {
			'W18N66-container': {
				x1: 8,
				y1: 1, 
				x2: 5,
				y2: 20
			},
			'container-W17N65': {
				x1: 5, 
				y1: 20, 
				x2: 48,
				y2: 4
			},
			'container-W17N65-2': {
				x1: 5, 
				y1: 20, 
				x2: 48,
				y2: 21
			}
		},
		'W17N66': {
			'container-W18N66': {
				x1: 12, 
				y1: 18, 
				x2: 1,
				y2: 13
			}
		},
		'W17N65': {
			'container1-W18N65': {
				x1: 20,
				y1: 8, 
				x2: 1,
				y2: 9
			},
			'container2-W18N65': {
				x1: 7,
				y1: 40,
				x2: 1,
				y2: 34
			},
			'container2-container1': {
				x1: 7,
				y1: 40, 
				x2: 20,
				y2: 8
			}
		}
	},
	run: function() {
		if (Memory.roadManager == null || Memory.roadManager.lastRan == null) {
			Memory.roadManager = {}; 
			Memory.roadManager.lastRan = Game.time;
		}
		if (Game.time % 1000 == 0) {
			if (Memory.roads == null) {
			Memory.roads = {}; 
			}
			for (roomkey in this.roads) {
				var roompaths = this.roads[roomkey]; 
				if (Memory.roads[roomkey] == null) {
					Memory.roads[roomkey] = {}; 
				}
				for (pathkey in roompaths) {
					var road = roompaths[pathkey]; 
					if (Memory.roads[roomkey][pathkey] == null) {
						var room = Game.rooms[roomkey]; 
						if (room != null) {
							console.log("x1: " + road.x1 + " y1: " + road.y1 + " x2: " + road.x2 + " y2: " + road.y2 + " roomkey " + roomkey);
							var path = room.findPath(new RoomPosition(road.x1, road.y1, roomkey), new RoomPosition(road.x2, road.y2, roomkey)); 

							Memory.roads[roomkey][pathkey] = Room.serializePath(path); 
						}
					}
				}
			}
			for (roomkey in Memory.roads) {
				var room = Game.rooms[roomkey]; 
				if (room != null) {
					for (pathkey in Memory.roads[roomkey]) {
						var path = Room.deserializePath(Memory.roads[roomkey][pathkey]);
						for (var i = 0; i < path.length; i++) {
				            room.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
				        }
					}
				}
			}
		}
		
	}
}

module.exports = roadmanager; 