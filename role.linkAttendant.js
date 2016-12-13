/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('role.linkAttendant');
 * mod.thing == 'a thing'; // true
 */


var roleLinkAttendant = {
	run: function(creep) {
		if(creep.room.name == 'W19N66') {
			var x = 23;
			var y = 16;
		} else {
			var x = 13;
			var y = 18; 
		}
		if (creep.pos.x != x || creep.pos.y != y) {
			var moveres = creep.moveTo(x, y); 
		}
		if (creep.room.name == 'W19N66') {
			var linkid = '583d62762a4dc22a576046ce';
			var storageid = '5837a270bff25a055c77dc84';
		} else {
			var linkid = '584e6e7331afb97531978ed0';
			var storageid = '584df83febe843e55332596c';
		}
		var link = Game.getObjectById(linkid); 
		var storage = Game.getObjectById(storageid);
		if (link != null) {
			if (link.energy > 0 && creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
				creep.withdraw(link, RESOURCE_ENERGY);
				return;
			}
		}
		if (storage != null) {
    		var tranResult = creep.transfer(storage, RESOURCE_ENERGY);
		}
	}
}
module.exports = roleLinkAttendant;