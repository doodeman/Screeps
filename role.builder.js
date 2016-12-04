var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        var spawn = Game.spawns['Spawn1'];
        creep.say(creep.memory.state);
        if (creep.memory.state == 'idle') {
            creep.memory.state = 'empty';
        }
        //creep.say(creep.memory.state);
        if(creep.carry.energy === 0) {
            creep.memory.state = 'empty';
        }
        else if (creep.carry.energy === creep.carryCapacity) {
            creep.memory.state = 'full';
        }
        if(creep.memory.state === 'full') {
            
            var towers = creep.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
            for (var i = 0; i < towers.length; i++) {
                if (towers[i].energyCapacity > towers[i].energy) {
                    var tranResult = creep.transfer(towers[i], RESOURCE_ENERGY); 
                    if (tranResult === ERR_NOT_IN_RANGE) {
                        creep.moveTo(towers[i]);
                        return; 
                    } else if (tranResult === ERR_FULL) {
                        creep.memory.state = 'full';
                        return; 
                    } else if (tranResult < 0) {
                        creep.say('bterr' + tranResult);
                        creep.memory.state = 'idle';
                        return; 
                    }
                    if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
                        creep.memory.state = 'full'; 
                        return;
                    }
                }
            }
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(sites.length === 0) {
                var upResult = creep.upgradeController(creep.room.controller);
                if(upResult == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                    return; 
                } else if (upResult == 0) {
                    return;
                } else {
                    creep.say('fuer' + upResult);
                    return;
                }
            } else {
                var buildres = creep.build(sites[0]); 
                if (buildres == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0]);
                    return;
                } else if (buildres === 0) {
                    return;
                } else {
                    creep.say('buerr' + buildres);
                    return;
                }
            }
        }
        if(creep.memory.state === 'empty') {
            var tranResult = spawn.transferEnergy(creep); 
            if (tranResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
                return; 
            } else if (tranResult === ERR_FULL) {
                creep.memory.state = 'full';
                return; 
            } else if (tranResult < 0) {
                creep.say('berr' + tranResult);
                creep.memory.state = 'idle';
                return; 
            }
            if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
                creep.memory.state = 'full'; 
                return;
            }
        }
    }
};

module.exports = roleBuilder;