var shared = require('shared');

var spawn2spawnhauler = {
    run: function(creep) {
        if (creep.carry[RESOURCE_ENERGY] == 0) {
            creep.memory.state = 'load';
        } else {
            creep.memory.state = 'unload';
        }
        if (creep.memory.state == 'load') {
            if (creep.room.name != 'W19N66') {
                shared.moveBetweenRooms(creep, 'W19N66'); 
                creep.say('1');
                return; 
            } else {
                var storage = Game.getObjectById('5837a270bff25a055c77dc84');
                storage.transfer(creep, RESOURCE_ENERGY);
                creep.moveTo(storage); 
                creep.say('2');
                return;
            }
        } 
        if (creep.memory.state == 'unload') {
            if (creep.room.name != 'W18N67') {
                shared.moveBetweenRooms(creep, 'W18N67');
                creep.say('3');
                return; 
            } else {
                var storage = Game.getObjectById('584df83febe843e55332596c');
                creep.transfer(storage, RESOURCE_ENERGY);
                creep.moveTo(storage);
                creep.say('4');
            }
        }
    }
}


module.exports = spawn2spawnhauler; 