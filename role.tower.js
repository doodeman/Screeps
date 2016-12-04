
var analyzer = require('enemyAnalyzer');


var roleTower = {
    run: function(tower) {
        var hostiles = tower.room.find(FIND_HOSTILE_CREEPS); 
        if (hostiles.length > 0) {
            tower.room.controller.activateSafeMode();
            tower.attack(hostiles[0]);
            analyzer.request(tower.room.name);
        }
    }
};


module.exports = roleTower;