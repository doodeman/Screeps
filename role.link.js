var roleLink = {
	run: function(link) {
		if (link.id != '583d62762a4dc22a576046ce' && link.id != '5847d9f80a4d3d50492ef25c') {
			if (link.energy >= 20) {
				if (link.room.name == 'W19N66') {
					link.transferEnergy(Game.getObjectById('583d62762a4dc22a576046ce'));
				} else {
					link.transferEnergy(Game.getObjectById('5847d9f80a4d3d50492ef25c'));
				}
			}
		}
	}
}

module.exports = roleLink;