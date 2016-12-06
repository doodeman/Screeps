var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleExplorer = require('role.explorer');
var roleBuilder = require('role.builder');
var roleTower = require('role.tower');
var roleMiner = require('role.miner');
var roleHauler = require('role.hauler');
var roleWarrior = require('role.warrior');
var roleExtensionManager = require('role.extensionManager');
var roleRepairer = require('role.repairer');
var roleLongrangeminer = require('role.longrangeminer');
var roleHealer = require('role.healer');
var roleClaimer = require('role.claimer');
var roleLrhauler = require('role.lrhauler');
var analyzer = require('enemyAnalyzer');
var roleLinkAttendant = require('role.linkAttendant');
var roleLink = require('role.link');
var roleRoamingWorker = require('role.roamingworker');
var economyMonitor = require('economymonitor');
var roleTargetedBuilder = require('role.targetedbuilder');
var roleSpawn = require('role.spawn');
var creepManager = require('creepmanager');
var MAX_HARVESTERS =3;
var MAX_BUILDERS = 0; 
var MAX_EXPLORERS = 2; 
var MAX_MINERS = 2;
var MAX_HAULERS = 3;
var MAX_LRM = 2;
var MAX_WARRIORS = 2;
var MAX_HEALERS = 2;
var MAX_CLAIMERS = 1;
var MAX_REPAIRERS = 1;
var MAX_LRHAULERS = 3;
var MAX_ROAMINGWORKERS = 1;
var MAX_TARGETEDBUILDERS = 1;
var CLAIMERROOMS = ['W18N67'];

var shared = require('shared');

const profiler = require('screeps-profiler');


var getTotalEnergy = function() {
    var spawn = Game.spawns['Spawn1'];
    var totalCapacity = 0;
    var usedCapacity = 0;
    spawn.room.find(FIND_STRUCTURES, {
        filter: function(structure) {
            if ((structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) && structure.isActive()) {
                totalCapacity += structure.storeCapacity; 
                usedCapacity += structure.store[RESOURCE_ENERGY];
            }
        }
    });
    totalCapacity += spawn.energyCapacity;
    usedCapacity += spawn.energy;
    var empty = totalCapacity - usedCapacity;
    return usedCapacity;
}




var adjacent = function(obj) {
    var adjacent = 0;
    for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
            var lookat = obj.room.lookAt(obj.pos.x-1 + x, obj.pos.y-1 + y);
            for(var i = 0; i < lookat.length; i++) {
                if ((lookat[i].type === 'terrain' && lookat[i].terrain === 'wall') || (lookat[i].type == 'creep')) {
                    adjacent += 1;
                } 
            }
            //if (lookat > 0) {
             //   adjacent += 1; 
            //}
        }
    }
    return adjacent;
}

var logObject = function(p) {
    for (var key in p) {
        console.log(key + " -> " + p[key]);
    }
}



var getPathsToSources = function() {
    var spawn = Game.spawns['Spawn1'];
    var sources = spawn.room.find(FIND_SOURCES);
    var paths = [];
    for (var i = 0; i < sources.length; i++) {
        paths.push(spawn.room.findPath(spawn.pos, sources[i].pos, {ignoreCreeps: true}));
    }
    for (var i = 0; i < paths.length; i++) {
        for (var n = 0; n < paths[i].length; n++) {
            var conRes = spawn.room.createConstructionSite(paths[i][n].x, paths[i][n].y, STRUCTURE_ROAD);
        }
    }
    var contPath = spawn.room.findPath(spawn.pos, spawn.room.controller.pos, {ignoreCreeps: true});
    for (var i = 0; i < contPath.length; i++) {
        spawn.room.createConstructionSite(contPath[i].x, contPath[i].y, STRUCTURE_ROAD);
    }
}

var getPathToExit = function() {
    var spawn = Game.spawns['Spawn1'];
    var storage = Game.getObjectById('57ef9d7886f108ae6e60dcc0');
    var route = Game.map.findRoute(storage.room, 'W19N66');
    if(route.length > 0) {
        var path = storage.pos.findPathTo(storage.pos.findClosestByRange(route[0].exit), {ignoreRoads: true});
        for (var i = 0; i < path.length; i++) {
            storage.room.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
        }
    }
}

profiler.enable();
module.exports.loop = function () {
    //getPathToExit();
    profiler.wrap(function() {
        //shared.getPath(14, 38, 27, 48, 'W19N68');
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                if (Memory.creeps[name].totalenergydeposited != null) {
                }
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }
        var spawn = Game.spawns['Spawn1'];
        var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler'  && creep.memory.spawn != 'W18N67');
        var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner'  && creep.memory.spawn != 'W18N67');
        var minerconf = [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE];
        if (miners.length < MAX_MINERS) {
            var newName = Game.spawns['Spawn1'].createCreep(minerconf, 'miner' + Math.floor((Math.random()*100000000) + 1), {role: 'miner', originalRole: 'miner', state: 'idle' });
        }
        var spawned = false; 
        if (haulers.length < MAX_HAULERS) {
            if(spawn.canCreateCreep([CARRY,CARRY,CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE]) == 0) {
                var newName = Game.spawns['Spawn1'].createCreep([CARRY,CARRY,CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], 'hauler' + Math.floor((Math.random()*100000) + 1), {role: 'hauler', originalRole: 'hauler', state: 'idle'});
            }
        }
        
        var spawnc = roleClaimer.spawnClaimer(MAX_CLAIMERS);
        if (spawnc && !spawned) {
            var claimerconf = [CLAIM, MOVE]; 
            var newName = Game.spawns['Spawn1'].createCreep(claimerconf, 'claimer' + Math.floor((Math.random()*100000) + 1), {role: 'claimer', originalRole: 'claimer', state: 'idle'});
        }
        
        
        var lrm = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer' && creep.memory.spawn != 'W18N67');
        var repairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer' && creep.memory.spawn != 'W18N67');
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester' && creep.memory.spawn != 'W18N67');
        var warriors = _.filter(Game.creeps, (creep) => creep.memory.role == 'warrior');
        var healers = _.filter(Game.creeps, (creep) => creep.memory.role == 'healer');
        var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.spawn != 'W18N67');
        var lrhaulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler' && creep.memory.spawn != 'W18N67');
        var explorers = _.filter(Game.creeps, (creep) => creep.memory.role == 'explorer');
        var linkattendants = _.filter(Game.creeps, (creep) => creep.memory.role == 'linkattendant');
        var roamingworkers = _.filter(Game.creeps, (creep) => creep.memory.role == 'roamingworker');
        var targetedbuilders = _.filter(Game.creeps, (creep) => creep.memory.role == 'targetedbuilder');
        
        var creepsInRange = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {
            filter: function(obj) {
                return obj.ticksToLive < 1400;
            }
        });
        var spawning = false;
        for (var i = 0; i < creepsInRange.length; i++) {
            if (creepsInRange[i].ticksToLive < 1400) {
                var renew = spawn.renewCreep(creepsInRange[i]);
                break;
            }
        }
        if (linkattendants.length == 0) {
            var linkattendantconfig = [CARRY, CARRY, CARRY, MOVE];
            var newName = Game.spawns['Spawn1'].createCreep(linkattendantconfig, 'linkattendant' + Math.floor((Math.random()*100000) + 1), {role: 'linkattendant', originalRole: 'linkattendant', state: 'idle'});
            
        }
        
        if (healers.length < MAX_HEALERS && !spawned) {
            var healerconf = [TOUGH, HEAL, HEAL, HEAL, MOVE, MOVE, MOVE, MOVE];
            var newName = Game.spawns['Spawn1'].createCreep(healerconf, 'healer' + Math.floor((Math.random()*100000) + 1), {role: 'healer', originalRole: 'healer', state: 'idle'});
        }
        if (warriors.length < MAX_WARRIORS && !spawned) {
            var warriorconf = [TOUGH, ATTACK, MOVE, MOVE, TOUGH, ATTACK, MOVE, MOVE, TOUGH, ATTACK, MOVE, MOVE];
            var warriorconfweak = [ATTACK, MOVE];
            var newName = Game.spawns['Spawn1'].createCreep(warriorconf, 'warrior' + Math.floor((Math.random()*100000) + 1), {role: 'warrior', originalRole: 'warrior', state: 'idle'});
        }
        var lrmcost = 950;
        var lrhaulercost = 1450;
        if (creepsInRange.length === 0) {
            if (miners.length >= MAX_MINERS && haulers.length >= MAX_HAULERS && warriors.length >= MAX_WARRIORS && healers.length >= MAX_HEALERS) {
                if (targetedbuilders.length < MAX_TARGETEDBUILDERS) {
                    var targetedbuilderconfig = [WORK, WORK, WORK, WORK, CARRY,CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
                    var newName = Game.spawns['Spawn1'].createCreep(targetedbuilderconfig, 'targetedbuilder' + Math.floor((Math.random()*100000) + 1), {role: 'targetedbuilder', originalRole: 'targetedbuilder', state: 'idle'});
                }
                if (lrhaulers.length < MAX_LRHAULERS && !spawned) {
                    var lrhaulerconf = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
                    var newName = Game.spawns['Spawn1'].createCreep(lrhaulerconf, 'lrhauler' + Math.floor((Math.random()*100000) + 1), {role: 'lrhauler', originalRole: 'lrhauler', state: 'idle'});
                    if (!(newName < 0)) {
                        Memory.lrmcost += lrhaulercost;
                    } 
                }
                if (lrm.length < MAX_LRM && !spawned) {
                    var lrmconf = [ WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE];
                    var newName = Game.spawns['Spawn1'].createCreep(lrmconf, 'lrm' + Math.floor((Math.random()*100000) + 1), {role: 'longrangeminer', originalRole: 'longrangeminer', state: 'idle',totalenergydeposited: 0});
                    if (!(newName < 0)) {
                        Memory.lrmcost += lrmcost;
                    } 
                }
                if (roamingworkers.length < MAX_ROAMINGWORKERS) {
                    var roamingconf = [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
                    if (spawn.canCreateCreep(roamingconf) == 0) {
                        var newName = Game.spawns['Spawn1'].createCreep(roamingconf, 'roamingworker' + Math.floor((Math.random()*100000) + 1), {role: 'roamingworker', originalRole: 'roamingworker', state: 'idle'});
                    }
                }
                if (repairers.length < MAX_REPAIRERS && !spawned) {
                    var repairerconf = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
                    if (spawn.canCreateCreep(repairerconf) == 0) {
                        var newName = Game.spawns['Spawn1'].createCreep(repairerconf, 'repairer' + Math.floor((Math.random()*1000) + 1), {role: 'repairer', originalRole: 'repairer', state: 'idle' });
                    }
                }
                if (explorers.length < MAX_EXPLORERS && !spawned) {
                    var explorerconf = [ATTACK, ATTACK, MOVE, MOVE];
                    if (spawn.canCreateCreep(explorerconf) == 0) {
                        var newName = Game.spawns['Spawn1'].createCreep(explorerconf, 'explorer' + Math.floor((Math.random()*1000) + 1), {role: 'explorer', originalRole: 'explorer', state: 'idle' });
                    }
                }
                var config = [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
                if (spawn.canCreateCreep(config) == 0 && !spawned){
                    if (harvesters.length < MAX_HARVESTERS) {
                        var newName = Game.spawns['Spawn1'].createCreep(config, 'harvester' + Math.floor((Math.random()*100000) +1), {role: 'harvester', originalRole: 'harvester', state: 'idle'});
                    }
                }
            }
        }
        
        var spawnname = '';
        if (spawn.spawning) {
            spawnname = spawn.spawning.name;
        }
        var lrhaulertargets = [];
        var oktouporbuild = ((miners.length >= MAX_MINERS && haulers.length >= MAX_HAULERS && warriors.length >= MAX_WARRIORS && lrm.length >= MAX_LRM));
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            //creep.say(creep.memory.state);
            if (creep.memory.role == 'extensionManager') {
                roleExtensionManager.run(creep);  
            } else if (creep.memory.role == 'miner') {
                roleMiner.run(creep);
            } else if (creep.memory.role == 'repairer') {
                roleRepairer.run(creep);
            } else if (creep.memory.role == 'hauler') {
                //creep.memory.state = 'idle';
                roleHauler.run(creep);
            } else if (creep.memory.role == 'longrangeminer') {
                roleLongrangeminer.run(creep);
            } else if (creep.memory.role == 'warrior') {
                roleWarrior.run(creep, true);
            } else if (creep.memory.role == 'healer') {
                roleHealer.run(creep, true);
            } else if (creep.memory.role == 'claimer') {
                roleClaimer.run(creep);
            } else if (creep.memory.role == 'lrhauler') {
                roleLrhauler.run(creep);
                lrhaulertargets.push(creep.memory.room);
            } else if (creep.memory.role == 'explorer') {
                roleExplorer.run(creep);
            } else if (creep.memory.role == 'linkattendant') {
                roleLinkAttendant.run(creep);
            } else if (creep.memory.role == 'roamingworker') {
                roleRoamingWorker.run(creep);
            } else if (creep.memory.role == 'targetedbuilder') {
                roleTargetedBuilder.run(creep);
            }
            else {
                roleHarvester.run(creep, oktouporbuild);
            }
        }
        var towers = spawn.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => roleTower.run(tower));
        var links = spawn.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
        links.forEach(link => roleLink.run(link));
        roleSpawn.run(Game.spawns['W18N67']);
        analyzer.run();
        economyMonitor.run();
        creepManager.run();
        //economyMonitor.updateContainers();
    });
    
}

