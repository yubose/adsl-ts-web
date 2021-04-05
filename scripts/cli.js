console.clear()
const path = require('path')
const { exec, execSync, execFile, spawn, spawnSync } = require('child_process')

const file = exec('git status')

file.stdout.on('data', (d) => {
  console.log(d)
})

// file.stdout.pipe(process.stdout)
// process.stdout.pipe(file.stdout)
