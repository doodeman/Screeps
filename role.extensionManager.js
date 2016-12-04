

var extensionManager = {
    
    run: function(creep) {
        var spawn = Game.spawns['Spawn1'];
        if (creep.memory.state == 'idle') {
            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
                creep.memory.state = 'full';
                return;
            }
            if (spawn.energy >= 50) {
                var tranResult = spawn.transferEnergy(creep); 
                creep.say('spawntr');
                if (tranResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn);
                    return; 
                } else if (tranResult === ERR_FULL) {
                    creep.memory.state = 'full';
                    return; 
                } else if (tranResult < 0) {
                    creep.say('err' + tranResult);
                    creep.memory.state = 'idle';
                    return; 
                }
                if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
                    creep.memory.state = 'full'; 
                    return;
                }
                return;
            } else {
                creep.memory.state = 'filling';
            }
        }
        if (creep.memory.state == 'full') {
            //creep.say(creep.memory.state);
            if(creep.carry[RESOURCE_ENERGY] == 0) {
                creep.memory.state = 'idle';
                return;
            }
            if (creep.memory.target == '') {
                var target = getNonFullStorage(creep);
                if (target == -1) {
                    return;
                }
                creep.memory.target = target.id;
                return; 
            } else {
                var target = Game.getObjectById(creep.memory.target);
                if (target == null) {
                    creep.say('notarget');
                    creep.memory.target = '';
                    return;
                }
                var tranResult = creep.transfer(target, RESOURCE_ENERGY); 
                if (tranResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                    return; 
                } else if (tranResult === ERR_FULL) {
                    creep.memory.state = 'full';
                    creep.memory.target = '';
                    return; 
                } else if (tranResult < 0) {
                    creep.say('err' + tranResult);
                    creep.memory.state = 'idle';
                    creep.memory.target = '';
                    return; 
                }
                if (tranResult === 0 && target.energy == target.energyCapacity) {
                    creep.memory.target = '';
                    if (creep.energy == 0) {
                        creep.memory.state = 'idle';
                    } 
                    return;
                }
                return;
            }
        }
        if(creep.memory.state == 'filling') {
            //creep.say(creep.memory.state);
            if (creep.energy == creep.carryCapacity) {
                creep.memory.state = 'full';
                return;
            }
            if(creep.memory.target == null || creep.memory.target == '') {
                var target = getNonEmptyContainer(creep);
                if (target == -1) {
                    return;
                } 
                creep.memory.target = target.id;
            } else {
                var target = Game.getObjectById(creep.memory.target);
                if (target == null) {
                    creep.say('errid');
                    creep.memory.state = 'idle'; 
                    return; 
                }
            }
            if (target.structureType == STRUCTURE_CONTAINER) {
                var tranResult = target.transfer(creep, RESOURCE_ENERGY);
            } else {
                var tranResult = target.transferEnergy(creep); 
            }
            if (tranResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
                return; 
            } else if (tranResult === ERR_FULL) {
                creep.memory.state = 'idle';
                return; 
            } else if (tranResult < 0) {
                creep.say('berr' + tranResult);
                creep.memory.state = 'idle';
                return; 
            }
            if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
                creep.memory.state = 'building'; 
                return;
            }
        }
    }
}

module.exports = extensionManager; 