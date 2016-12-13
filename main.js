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
var roleLrhauler = require('role.lrhauler');
var roleHealer = require('role.healer');
var roleClaimer = require('role.claimer');
var analyzer = require('enemyAnalyzer');
var roleLinkAttendant = require('role.linkAttendant');
var roleLink = require('role.link');
var roleRoamingWorker = require('role.roamingworker');
var economyMonitor = require('economymonitor');
var roleTargetedBuilder = require('role.targetedbuilder');
var roleSpawn = require('role.spawn');
var creepManager = require('creepmanager');
var roleWallWorker = require('wallworker');
var spawn2spawnhauler = require('role.spawn2spawnhauler');
var MAX_HARVESTERS = 2;
var MAX_BUILDERS = 0; 
var MAX_EXPLORERS = 2; 
var MAX_MINERS = 2;
var MAX_HAULERS = 3;
var MAX_LRM = 3;
var MAX_WARRIORS = 1;
var MAX_HEALERS = 1;
var MAX_CLAIMERS = 1;
var MAX_REPAIRERS = 1;
var MAX_LRHAULERS = 4;
var MAX_ROAMINGWORKERS = 2;
var MAX_TARGETEDBUILDERS = 0;
var CLAIMERROOMS = ['W18N67'];
var roadmanager = require('roadmanager');

var shared = require('shared');

const profiler = require('screeps-profiler');


var logObject = function(p) {
    for (var key in p) {
        console.log(key + " -> " + p[key]);
    }
}

profiler.enable();
module.exports.loop = function () {
    profiler.wrap(function() {
        console.log("\nTick " + Game.time);
        //shared.getPath(30, 10, 5, 20, 'W18N65');
        //Game.profiler.reset();
        //Game.profiler.restart();
        //Game.profiler.email(100);
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                if (Memory.creeps[name].totalenergydeposited != null) {
                }
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        var spawn = Game.spawns['Spawn1'];
        roleTower.run();

        var lrm = _.filter(Game.creeps, (creep) => creep.memory.role == 'longrangeminer');
        var warriors = _.filter(Game.creeps, (creep) => creep.memory.role == 'warrior');
        var healers = _.filter(Game.creeps, (creep) => creep.memory.role == 'healer');
        var lrhaulers = _.filter(Game.creeps, (creep) => creep.memory.role == 'lrhauler');
        var explorers = _.filter(Game.creeps, (creep) => creep.memory.role == 'explorer');
        var roamingworkers = _.filter(Game.creeps, (creep) => creep.memory.role == 'roamingworker');
        var targetedbuilders = _.filter(Game.creeps, (creep) => creep.memory.role == 'targetedbuilder');
        var spawned = false; 
       
        
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

        var needed = []; 
        
        if (healers.length < creepManager.creepRoles['healer'].max()) {
            needed.push('healer');
        }
        
        if (warriors.length < creepManager.creepRoles['warrior'].max()) {
            needed.push('warrior'); 
        }
        if (targetedbuilders.length < creepManager.creepRoles['targetedbuilder'].max()) {
            needed.push('targetedbuilder');
        }

        //var lrHaulerNeeded = roleLrhauler.needLrHauler(); 

        var lrMinerNeed = economyMonitor.lrMinerNeed();
        //console.log("lrMinerNeed: " + lrMinerNeed);
        if (lrMinerNeed.length > 0) {
            needed.push('longrangeminer');
        }
        var lrHaulerNeed = economyMonitor.lrHaulerNeed();
        console.log("lrhaulerneed: " + lrHaulerNeed);
        if (lrHaulerNeed.length > 0) {
            console.log("need lrhauler!");
            needed.push('lrhauler');
        }
        if (roamingworkers.length < creepManager.creepRoles['roamingworker'].max()) {
            needed.push('roamingworker');
        }
        
        
        var lrhaulertargets = []; for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            //creep.say(creep.memory.state);
            if (creep.memory.spawn == 'W19N66') {
                creep.memory.spawn = 'Spawn1';
            }
            if (creep.memory.role == 'extensionManager') {
                roleExtensionManager.run(creep);  
            } else if (creep.memory.role == 'miner') {
                roleMiner.run(creep);
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
            } else if (creep.memory.role == 'wallworker') {
                roleWallWorker.run(creep);
            } else if (creep.memory.role == 'spawn2spawnhauler') {
                spawn2spawnhauler.run(creep);
            }
            else {
                roleHarvester.run(creep, true);
            }
        }
        var links = spawn.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}});
        links.forEach(link => roleLink.run(link));

        var neededstr = ""; 
        for (var i = 0; i < needed.length; i++) {
            neededstr += needed[i] + " ";
        }
        var ret = roleSpawn.run(Game.spawns['W18N67'], needed[0]);
        if (_.isString(ret)) {
            needed.shift();
        } else {
        }
        roleSpawn.run(Game.spawns['Spawn1'], needed[0]);
        roleSpawn.run(Game.spawns['W18N65']);
        analyzer.run();
        economyMonitor.run();
        creepManager.run();
        roadmanager.run();
        //economyMonitor.updateContainers();
    });
    
}

