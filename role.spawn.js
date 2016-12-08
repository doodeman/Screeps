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
var creepManager = require('creepmanager');

var HARVEST_SPD = 2;
var REPAIR_SPD = 1; 
var BUILD_SPD = 5;
var UPGD_SPD = 1;

var CLAIMROOMS = {
    'W18N67': ['W17N67', 'W19N67'],
    'Spawn1': ['W18N66', 'W18N65']
}

var ROLENAMES = ['hauler', 'miner', 'harvester', 'repairer', 'claimer', 'linkattendant'];
var ROLES = {
    'hauler': {
        max: function(spawn) {
            var ret = spawn.room.find(FIND_STRUCTURES, { 
                filter: function(obj) { return obj.structureType == STRUCTURE_CONTAINER; }
            }).length;
            //console.log("max hauler for " + spawn.name + " " + ret);
            return ret + 1;
        },
        configuration: [CARRY,CARRY,CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE]
    },
    'miner': {
        max: function(spawn) {
            return spawn.room.find(FIND_SOURCES).length;
        },
        configuration: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE]
    },
    'harvester': {
        max: function(spawn) {
            switch (spawn.name) {
                case 'W18N67': 
                    return 2; 
                case 'Spawn1': 
                    return 4; 
            }
            return 3;
            var currHarvesterConfig = getCreepConfig(spawn, 'harvester');
            var currUpgSpd = getCreepUpgdSpeed(currHarvesterConfig);
            var sourcescount = spawn.room.find(FIND_SOURCES).length;
            var energyPerTick = sourcescount * (3000/300);
            return Math.floor(energyPerTick/currUpgSpd)+3;
        },
        configuration: [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE,MOVE, MOVE, MOVE]
    },
    'repairer': {
        max: function(spawn) {
            return 1; 
        },
        configuration: [CARRY, MOVE, WORK, CARRY, MOVE, WORK]
    },
    'claimer': {
        max: function(spawn) {
            return 1; 
        }, 
        configuration: [MOVE, CLAIM]
    },
    'linkattendant': {
        max: function(spawn) {
            return 1; 
        }, 
        configuration: [MOVE, CARRY, CARRY, CARRY]
    }
};

var COSTS = {
    "move": 50,
    "work": 100,
    "carry": 50,
    "attack": 79,
    "ranged_attack": 150,
    "tough": 10,
    "heal": 250,
    "claim": 600
}

var updateSpawnCap = function(spawn) {
    if (Memory[spawn.id].energycap == null || Game.time % 50 == 0) {
        var extensions = spawn.room.find(FIND_MY_STRUCTURES, {
            filter: function(obj) { return obj.structureType == STRUCTURE_EXTENSION && obj.isActive(); }
        });
        
        var total = 300 + (50*extensions.length);
        Memory[spawn.id].energycap = total; 
    }
}

var updateMaximums = function(spawn) {
    if (Memory[spawn.id].maximums == null) {
        Memory[spawn.id].maximums = {}
    }
    for (var i = 0; i < ROLENAMES.length; i++) {
        var rolename = ROLENAMES[i];
        var max = ROLES[rolename].max(spawn);
        Memory[spawn.id].maximums[rolename] = ROLES[rolename].max(spawn);
    }
}

var getCreepHarvestSpeed = function(config) {
    var workparts = 0;
    for (var i = 0; i < config.length; i++) {
        if (config[i] == WORK) {
            workparts += 1;
        }
    }
    return workparts * HARVEST_SPD;
}

var getCreepUpgdSpeed = function(config) {
    var workparts = 0;
    for (var i = 0; i < config.length; i++) {
        if (config[i] == WORK) {
            workparts += 1;
        }
    }
    return workparts;
}

var getCreepConfig = function(spawn, role) {
    return ROLES[role].configuration;
    var config = []; 
    if (Memory[spawn.id].energycap == null) {
        updateSpawnCap(spawn); 
    }
    var partCost = getConfigCost(config); 
    var currentCost = 0; 
    var partcost = getConfigCost(ROLES[role].configuration);
    while (getConfigCost(config) < Memory[spawn.id].energycap - partcost + 1) {
        config = config.concat(ROLES[role].configuration); 
    }
    
    return config; 
}

var getConfigCost = function(config) {
    var cost = 0; 
    for (var i = 0; i < config.length; i++) {
        cost += COSTS[config[i]];
    }
    return cost;
}

var updateCreeps = function(spawn, neededRole) {
    if (Memory[spawn.id] == null) {
        Memory[spawn.id] = {};
    }
    if (Memory[spawn.id].maximums == null || Game.time % 20 == 0) {
        Memory[spawn.id].creeps = {};
        updateMaximums(spawn);
    }

    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner');

    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.spawn == spawn.name);
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler' && creep.memory.spawn == spawn.name); 
    var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.spawn == spawn.name); 

    

    var canSpawn = (miners.length > 0) && (haulers.length > 0); 
    
    var claimerNeeded = roleClaimer.claimerNeeded(CLAIMROOMS[spawn.name]);
    var statusstr = "Can spawn non-hauler&miner: " + canSpawn; 
    for (var i = 0; i < ROLENAMES.length; i++) {
        var rolename = ROLENAMES[i];

        var creeps = _.filter(Game.creeps, (creep) => creep.memory.role == ROLENAMES[i] && creep.memory.spawn == spawn.name);
        if (Memory[spawn.id].maximums[rolename] == null) {
            updateMaximums(spawn);
        }
        var spawning = false; 
        //console.log( spawn.name + "Max " + rolename + " " + Memory[spawn.id].maximums[rolename] + " " + creeps.length);
        statusstr = statusstr + ROLENAMES[i] + " " + creeps.length + ":" + Memory[spawn.id].maximums[rolename] + " "; 
        if (creeps.length < Memory[spawn.id].maximums[rolename] 
            || (rolename == 'hauler' && haulers.length == 1 && haulers[0].ticksToLive < 200) 
            || (rolename == 'claimer' && claimerNeeded != null)) {
            var config = getCreepConfig(spawn, rolename);
            var canspawn = spawn.canCreateCreep(config);
            if ((canspawn == 0 && canSpawn) || rolename == 'hauler' || rolename == 'miner') {
                spawning = true; 
                if (rolename != 'claimer' && rolename != 'longrangeminer' && rolename != 'lrhauler') {
                    var newName = spawn.createCreep(config, rolename + Math.floor((Math.random()*100000) + 1), { role: rolename, originalRole: rolename, state: 'idle', room: spawn.room.name, spawn: spawn.name});
                } else if (rolename == 'claimer') {
                    console.log(spawn.room.name + " spawning claimer " + claimerNeeded);
                    var newName = spawn.createCreep(config, rolename + Math.floor((Math.random()*100000) + 1), 
                        { role: rolename, originalRole: rolename, state: 'idle', room: claimerNeeded, spawn: spawn.name}); 
                }
            }
            //var newName = Game.spawns['Spawn1'].createCreep(lrhaulerconf, 'lrhauler' + Math.floor((Math.random()*100000) + 1), {role: 'lrhauler', originalRole: 'lrhauler', state: 'idle'});
            
        }
        
        //console.log(spawn.name + " " + spawnname);
    }
    if (spawn.spawning != null) {
            //console.log(spawn.name + " spawning " + spawn.spawning.name);
    }
    if (!spawning && neededRole != null) {
        if (neededRole == 'lrhauler') {
            var targetRoom = roleLrhauler.needLrHauler()[0]; 
        } else if (neededRole = 'longrangeminer') {
            var targetRoom = roleLongrangeminer.needLrm()[0];
        } 
        else {
            var targetRoom = spawn.room.name; 
        }
        var newName = spawn.createCreep(creepManager.creepRoles[neededRole].configuration, neededRole + Math.floor((Math.random()*100000) + 1), { role: neededRole, originalRole: neededRole, state: 'idle', room: targetRoom, spawn: spawn.name});     
        return newName; 
    }
    return -1; 
    /*
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler' && creep.memory.spawn == spawn.name); 
    if (haulers.length == 0) {
        var lrhaulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler' && creep.memory.spawn == spawn.name); 
        if (lrhaulers.length > 0) {
            console.log("converting " + lrhaulers[0].name + " to hauler");
            lrhaulers[0].memory.role = 'hauler'; 
            lrhaulers[0].memory.room = spawn.room.name;
            lrhaulers[0].memory.target = '';
        }
    }
    */
    
}

var roleSpawn = {
	run: function(spawn, neededRole) {
        //console.log("ruinning: " + spawn.name + " neededRole: " + neededRole);

        if(Memory[spawn.id] == null) {
            Memory[spawn.id] = {};
        }
        updateSpawnCap(spawn);
        var ret = updateCreeps(spawn, neededRole);
        var roomlevel = spawn.room.controller.level; 
        
		var hostiles = spawn.room.find(FIND_HOSTILE_CREEPS); 
        if (hostiles.length > 0) {
            spawn.room.controller.activateSafeMode();
        }
        
        var towers = spawn.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => roleTower.run(tower));

        var links = spawn.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
        links.forEach(link => roleLink.run(link));
	   return ret;
    }
}

module.exports = roleSpawn; 