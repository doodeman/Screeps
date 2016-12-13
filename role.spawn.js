var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleExplorer = require('role.explorer');
var roleBuilder = require('role.builder');
var roleTower = require('role.tower');
var roleMiner = require('role.miner');
var roleHauler = require('role.hauler');
var roleWarrior = require('role.warrior');
var roleExtensionManager = require('role.extensionManager');
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
    'Spawn1': ['W18N66'],
    'W18N65': []
}

var ROLENAMES = ['hauler', 'miner', 'harvester', 'claimer', 'linkattendant', 'wallworker', 'spawn2spawnhauler'];
var ROLES = {
    'hauler': {
        max: function(spawn) {
            switch (spawn.name) {
                case 'W18N67': 
                    return 1; 
                case 'Spawn1': 
                    return 1; 
                case 'W18N65': 
                    return 1; 
            }
        },
        configuration: function(spawn) {
            switch (spawn.name) {
                case 'W18N67': 
                    return [CARRY,CARRY,CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
                case 'Spawn1': 
                    return [CARRY,CARRY,CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
                case 'W18N65': 
                    return [CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE];            
                }
        }
    },
    'miner': {
        max: function(spawn) {
            return spawn.room.find(FIND_SOURCES).length;
        },
        configuration: function(spawn) {
            
            switch (spawn.name) {
                case 'W18N67': 
                    return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE]; 
                case 'Spawn1': 
                    return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE]; 
                case 'W18N65': 
                    return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE]; 
            }
        } 
    },
    'harvester': {
        max: function(spawn) {
            switch (spawn.name) {
                case 'W18N67': 
                    return 3; 
                case 'Spawn1': 
                    return 1; 
                case 'W18N65': 
                    return 2; 
            }
            return 3;
            var currHarvesterConfig = getCreepConfig(spawn, 'harvester');
            var currUpgSpd = getCreepUpgdSpeed(currHarvesterConfig);
            var sourcescount = spawn.room.find(FIND_SOURCES).length;
            var energyPerTick = sourcescount * (3000/300);
            return Math.floor(energyPerTick/currUpgSpd)+3;
        },
        configuration: function(spawn) {switch (spawn.name) {
                case 'W18N67': 
                    return [WORK, WORK, WORK, WORK, WORK, WORK, WORK,  CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE,MOVE, MOVE]; 
                case 'Spawn1': 
                    return [WORK, WORK, WORK, WORK, WORK, WORK, WORK,  CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE,MOVE, MOVE]; 
                case 'W18N65': 
                    return [WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE]; 
            }
        }
    },
    'claimer': {
        max: function(spawn) {
            return 1; 
        }, 
        configuration: function(spawn) {
            return [MOVE, CLAIM];
        } 
    },
    'linkattendant': {
        max: function(spawn) {
            switch (spawn.name) {
                case 'W18N67': 
                    return 1; 
                case 'Spawn1': 
                    return 1; 
                case 'W18N65': 
                    return 0;  
            }
        }, 
        configuration: function(spawn) {
            return [MOVE, CARRY, CARRY, CARRY];
        }
    },
    'wallworker': {
        max: function(spawn) {
            switch (spawn.name) {
                case 'W18N67': 
                    return 2; 
                case 'Spawn1': 
                    return 1; 
                case 'W18N65': 
                    return 0; 
            }
        },
        configuration: function(spawn) {
            return [WORK, WORK, WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE, CARRY];
        }
    },
    'spawn2spawnhauler': {
        max: function(spawn) {
            if (spawn.room.name == 'W19N66') {
                return 0;
            } 
            return 0;
        },
        configuration: function(spawn) {
            return [CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE];
        }
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
    if (Memory.spawnCap == null || Memory.spawnCap.lastRan == null) {
        Memory.spawnCap = {}; 
        Memory.spawnCap.lastRan = Game.time; 
    }
    if (Memory[spawn.id].energycap == null || Game.time - Memory.spawnCap.lastRan < 100) {
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
    return ROLES[role].configuration(spawn);
    var config = []; 
    if (Memory[spawn.id].energycap == null) {
        updateSpawnCap(spawn); 
    }
    var partCost = getConfigCost(config); 
    var currentCost = 0; 
    var partcost = getConfigCost(ROLES[role].configuration(spawn));
    while (getConfigCost(config) < Memory[spawn.id].energycap - partcost + 1) {
        config = config.concat(ROLES[role].configuration(spawn)); 
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
    if (spawn.spawning != null) {
        //console.log(spawn.name + " spawning " + spawn.spawning.name.substring(0, 14));
    }

    if (Memory[spawn.id] == null) {
        Memory[spawn.id] = {};
    }

    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner');

    var miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner' && creep.memory.spawn == spawn.name);
    var haulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler' && creep.memory.spawn == spawn.name); 
    var claimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer' && creep.memory.spawn == spawn.name); 

    var minersmax = ROLES['miner'].max(spawn);
    var haulersmax = ROLES['hauler'].max(spawn);

    //console.log(spawn.name + " miners length " + miners.length + " minersmax " + minersmax + " haulers length " + haulers.length + " haulersmax " + haulersmax);
    var canSpawn = (miners.length >= minersmax) && (haulers.length >= haulersmax); 
    //console.log("miners length " + miners.length + " minersmax " + minersmax + " haulers length " + haulers.length + " haulersmax " + haulersmax + " canSpawn: " + canSpawn);

    var claimerNeeded = roleClaimer.claimerNeeded(CLAIMROOMS[spawn.name]);
    var statusstr = "Can spawn non-hauler&miner: " + canSpawn; 
    var spawning = false;
    for (var i = 0; i < ROLENAMES.length; i++) {
        var rolename = ROLENAMES[i];

        var creeps = _.filter(Game.creeps, (creep) => creep.memory.role == ROLENAMES[i] && creep.memory.spawn == spawn.name);
        if (Memory[spawn.id].maximums[rolename] == null) {
            updateMaximums(spawn);
        }
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
                    var newName = spawn.createCreep(config, rolename + Math.floor((Math.random()*100000) + 1), 
                        { role: rolename, originalRole: rolename, state: 'idle', room: claimerNeeded, spawn: spawn.name}); 
                }
            }
            //var newName = Game.spawns['Spawn1'].createCreep(lrhaulerconf, 'lrhauler' + Math.floor((Math.random()*100000) + 1), {role: 'lrhauler', originalRole: 'lrhauler', state: 'idle'});
            
        }
        
        //console.log(spawn.name + " " + spawnname);
    }
    if (spawn.spawning != null) {
    }
    //console.log(spawn.name + " spawning: " + spawning + " canSpawn " + canSpawn);
    if (!spawning && canSpawn && neededRole != null && spawn.name != 'W18N65') {
        //if (neededRole == 'lrhauler') {
         //   var targetRoom = roleLrhauler.needLrHauler()[0]; 
        //}
        var targetRoom = '';
        if (neededRole == 'longrangeminer') {
            var targetRoom = economyMonitor.lrMinerNeed()[0];
        } 
        if (neededRole == 'lrhauler') {
            var targetRoom = economyMonitor.lrHaulerNeed()[0];
        } 
        if (targetRoom == '') {
            var targetRoom = spawn.room.name; 
        }
        var targetRoom = spawn.room.name; 
        //console.log(spawn.name + " want to spawn " + neededRole);
        var newName = spawn.createCreep(creepManager.creepRoles[neededRole].configuration(spawn), neededRole + Math.floor((Math.random()*100000) + 1), { role: neededRole, originalRole: neededRole, state: 'idle', room: targetRoom, spawn: spawn.name});     
        //console.log("spawn result " + newName);
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