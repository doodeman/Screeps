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
		var x = 23;
		var y = 16;
		if (creep.pos.x != x || creep.pos.y != y) {
			var moveres = creep.moveTo(x, y); 
		}
		var linkid = '583d62762a4dc22a576046ce';
		var storageid = '5837a270bff25a055c77dc84';
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