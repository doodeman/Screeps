

var shared = require('shared');
var findTarget = function(creep) {
    var used = [];
    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner');
    var sources = creep.room.find(FIND_SOURCES);
    for (var i =0; i < miners.length; i++) {
        used.push(miners[i].memory.targetid);
    }
    for (var i = 0; i < sources.length; i++) {
        if (used.indexOf(sources[i].id) == -1) {
            creep.memory.state = 'harvesting'; 
            creep.memory.targetid = sources[i].id;
            return sources[i].id;
            return;
        }
    }
    creep.memory.state = 'harvesting'; 
    creep.memory.targetid = sources[0].id;
    return sources[0].id;
    return targetid;
}

var depositShortRange = function(creep) {
    var targets = shared.getContainersInRoom(creep.room.name); 
    if(targets.length > 0) {
        var target = creep.pos.findClosestByRange(targets);
        
        var transferResult = creep.transfer(target, RESOURCE_ENERGY);
        if(transferResult === -9) {
            return;
        }
        if(transferResult === 0) {
            return;
        }
        if(transferResult === -8) {
            return;
        }
    }
}

var roleMiner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.spawn == 'W18N67') {
            var spawn = Game.spawns['W18N67'];
        } else {
            var spawn = Game.spawns['Spawn1'];
        }
        if (creep.memory.room == null) {
            creep.memory.room = creep.room.name;
        }
        if (creep.room.name != creep.memory.room) {
            shared.moveBetweenRooms(creep, creep.memory.room);
            return;
        }
        if (creep.memory.targetid == null || creep.memory.targetid == '') {
            findTarget(creep);
        }
        if(creep.memory.state == 'noviable') {
            creep.memory.state = 'harvesting';
        }
        if(creep.memory.state == 'idle') {
            creep.memory.state = 'harvesting';
        }
        if(creep.memory.state === 'harvesting') {
            if (creep.carry.energy === creep.carryCapacity) {
                creep.memory.state = 'full';
                return;
            }
            var source = Game.getObjectById(creep.memory.targetid);
            if (source === null) {
                creep.say("snul:" + creep.memory.targetid);
                creep.memory.state = 'idle';
                return;
            }
            if (source.energy == 0 && source.ticksToRegeneration > 10) {
                creep.moveTo(spawn);
                var renewResult = spawn.renewCreep(creep);
                
                return;
            }
            var harvestResult = creep.harvest(source);
            creep.moveTo(source);
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (sites.length > 0 && creep.carry[RESOURCE_ENERGY] > 30) {
                var target = creep.pos.findClosestByRange(sites);
                if (target.pos.getRangeTo(creep.pos) < 5) {
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
            } else {
                depositShortRange(creep);
            }
            if(harvestResult !== 0) {
                var moveresult = creep.moveTo(source);
                if (moveresult !== 0 && moveresult !== -11) {
                    creep.say(moveresult + " " + source.pos.x + " " + source.pos.y);
                    creep.memory.state = 'idle';
                }
                
                return;
            } else {
                return;
            }
        }
        if(creep.memory.state === 'full') {
            creep.memory.state = 'depositing';
        }
        if(creep.memory.state === 'depositing') {
            if (_.sum(creep.carry) == 0) {
                creep.memory.state = 'harvesting';
                
                return;
            }
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (sites.length > 0) {
                var target = creep.pos.findClosestByRange(sites);
                if (target.pos.getRangeTo(creep.pos) < 2) {
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
            
            
           
            
            var targets = shared.getContainersInRoom(creep.room.name); 
            if(targets.length > 0) {
                
                var target = creep.pos.findClosestByRange(targets);
                if (target.hits < target.hitsMax) {
                    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                    return;
                }
                var transferResult = creep.transfer(target, RESOURCE_ENERGY);
                if(transferResult === -9) {
                    creep.moveTo(target);
                    return;
                }
                if(transferResult === 0) {
                    return;
                }
                if(transferResult === -8) {
                    return;
                }
            } else {
                if (targets == null) {
                    creep.say("targets null");
                    creep.memory.state = 'idle';
                    return;
                } 
                if (targets.length === 0) {
                    creep.say("tlen 0");
                    creep.memory.state = 'idle';
                    return;
                }
            }
            
            return;
        }
    }
};

module.exports = roleMiner;