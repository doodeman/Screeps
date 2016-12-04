var roleLink = {
	run: function(link) {
		if (link.id != '583d62762a4dc22a576046ce') {
			if (link.energy >= 20) {
				link.transferEnergy(Game.getObjectById('583d62762a4dc22a576046ce'));
			}
		}
	}
}

module.exports = roleLink;