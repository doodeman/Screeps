var roleLink = {
	run: function(link) {
		if (link.id != '583d62762a4dc22a576046ce' && link.id != '584e6e7331afb97531978ed0') {
			if (link.energy >= 200) {
				if (link.room.name == 'W19N66') {
					link.transferEnergy(Game.getObjectById('583d62762a4dc22a576046ce'));
				} else {
					link.transferEnergy(Game.getObjectById('584e6e7331afb97531978ed0'));
				}
			}
		}
	}
}

module.exports = roleLink;