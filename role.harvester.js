


var shared = require('shared');
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep, okaytoupgorbuild) {
        if (creep.memory.room == null) {
            creep.memory.room = creep.room.name;
        }
        if (creep.room.name != creep.memory.room) {
            shared.moveBetweenRooms(creep, creep.memory.room);
        }
        if (creep.memory.spawn != null) {
            var spawn = Game.spawns[creep.memory.spawn];
        } else {
            var spawn = Game.spawns['Spawn1'];
        }
        //creep.memory.state = 'idle';
        if (creep.ticksToLive < 1000 && creep.pos.getRangeTo(spawn) < 2 && spawn.energy > 100) {
            return;
        }
        if(creep.memory.state == 'idle') {
            creep.memory.state = 'filling';
            if (creep.energy == creep.carryCapacity) {
                creep.memory.state = 'full';
            }
        }
        if(creep.memory.state === 'full') {
            if (spawn.room.controller.ticksToDowngrade < 8000) {
                creep.memory.state = 'upgrading'; 
            }
            else if (creep.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
                creep.memory.state = 'building';
            }
            else {
                creep.memory.state = 'upgrading';
            } 
        }
        if(creep.memory.state == 'filling') {
            var nearlyfull = shared.getFullStorage(creep);
            if (!okaytoupgorbuild && nearlyfull == -1) {
                var flags = creep.room.find(FIND_FLAGS);
                if (flags.length) {
                    var flag = flags[0];
                    if (flag != null && flag.room.name == creep.room.name) {
                        creep.moveTo(flag);         
                        return;
                    }
                } else {
                    creep.moveTo(29, 32);
                }
                return;
            }
            if (creep.energy == creep.carryCapacity) {
                creep.memory.state = 'full';
                return;
            }
            if (target != -1) {
                if (nearlyfull != null && nearlyfull != -1) {
                    var target = nearlyfull;
                } else {
                    var target = shared.getFullStorage(creep);
                }
                if (target == -1) {
                    return;
                }
            }
            if (target.structureType == STRUCTURE_CONTAINER || target.structureType == STRUCTURE_STORAGE) {
                var tranResult = target.transfer(creep, RESOURCE_ENERGY);
            } else {
                var tranResult = target.transferEnergy(creep); 
            }
            if (creep.carry[RESOURCE_ENERGY] == creep.carryCapacity) {
                creep.memory.state = 'full';
                return;
            }
            if (tranResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
                return; 
            } else if (tranResult === ERR_FULL) {
                creep.memory.state = 'full';
                return; 
            } else if (tranResult < 0) {
                creep.say('berr' + tranResult);
                creep.memory.state = 'full';
                return; 
            }
            if (tranResult === 0 && creep.carry.energy === creep.carryCapacity) {
                creep.memory.state = 'full'; 
                return;
            }
        }
        if((creep.memory.state === 'depositing' || creep.memory.state === 'upgrading' || creep.memory.state === 'building') && creep.carry.energy == 0) {
            creep.memory.state = 'filling';
            return;
        } 
        if(creep.carry.energy === creep.carryCapacity && creep.memory.state !== 'full' && creep.memory.state !== 'depositing' && creep.memory.state !== 'upgrading' && creep.memory.state !== 'building') {
            creep.memory.state = 'full';
            return;
        }
        
        if(creep.memory.state === 'upgrading') {
            if(creep.carry == 0) {
                creep.memory.state = 'idle';
                return;
            }
            creep.moveTo(creep.room.controller);
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            }
            return;
        }
        if(creep.memory.state === 'building') {
            if (creep.energy == 0) {
                creep.memory.state = 'idle';
                return;
            }
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (sites.length == 0) {
                creep.memory.state = 'upgrading';
                return;
            }
            var target = creep.pos.findClosestByRange(sites);
            var buildres = creep.build(target); 
            if (buildres == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
                return;
            } else if (buildres === 0) {
                return;
            } else {
                creep.say('buerr' + buildres);
                return;
            }
        }
    }
};

module.exports = roleHarvester;