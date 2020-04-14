/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the ISC-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */

const fs = require('fs-extra');
const publicPath = 'build/';
const frontendDistDirectory = 'dist/';
const frontendDistOutput = 'build/dist/';
const additionalResources = [
    ['map.json', publicPath + 'map.json'],
    [frontendDistOutput + 'index.html', publicPath + 'index.html'],
    ['localConfig.json', publicPath + 'localConfig.json'],
    ['print.json', publicPath + 'print.json'],
    ['MapStore2/web/client/translations/', publicPath + 'MapStore2/web/client/translations/']
];

const filesAndDirectoriesToRemove = [

];

function copyDist() {
    return new Promise(function(resolve, reject) {
        fs.copy(
            frontendDistDirectory,
            frontendDistOutput,
            function(err) {
                if (err) return reject(err);
                console.log(' - dist copied');
                return resolve();
            }
        );
    });
}

function copyAdditionalResources() {
    return new Promise(function(resolve, reject) {
        console.log(' - copy additional resources');
        try {
            additionalResources.forEach(function(additionalResource) {
                fs.copySync(additionalResource[0], additionalResource[1]);
                console.log(`   - ${additionalResource[0]} copied`);
            });
            if (additionalResources.length === 0) console.log('   - no additional resources to copy');
        } catch(e) {
            return reject(e);
        }
        return resolve();
    });
}

function removeFilesAndDirectoriesFromOutput() {
    return new Promise(function(resolve, reject) {
        fs.readdir(
            frontendDistOutput,
            function(err, res) {
                if (err) return reject(err);
                console.log(' - remove files from output');
                try {
                    filesAndDirectoriesToRemove.forEach(function(fileOrDirectory) {
                        fs.removeSync(`${frontendDistOutput}${fileOrDirectory}`);
                        console.log(`   - ${frontendDistOutput}${fileOrDirectory} removed`);
                    });
                    if (filesAndDirectoriesToRemove.length === 0) console.log('   - no files or directories to remove');
                } catch(e) {
                    return reject(e);
                }
                return resolve();
            }
        );
    });
}

console.log(' ');
console.log(' -------------------------------------------------------------------------------');
console.log('  MOVE FILES AND DIRECTORIES');
console.log(' -------------------------------------------------------------------------------');
console.log(' ');

fs.emptyDir(publicPath)
    .then(function() {
        console.log(' ');
        console.log(' - static directory cleared');
    })
    .then(function() { return copyDist(); })
    .then(function() { return copyAdditionalResources(); })
    .then(function() { return removeFilesAndDirectoriesFromOutput(); })

    .then(function() { 
        console.log(' ');
        console.log(' - frontend build COMPLETED');
        console.log(' ');
        console.log(' -------------------------------------------------------------------------------');
        console.log(`  BUILD OUTPUT FOLDER: ${publicPath}`);
        console.log(' -------------------------------------------------------------------------------');
        console.log(' ');
    })
    .catch(function(err) { console.log(err); });
