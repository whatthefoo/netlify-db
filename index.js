#!/usr/bin/env node

const program = require("commander");
const createDb = require("./createDb");
const package = require("./package.json");

program.version(package.version, "-v, --version");

program
  .command("create <config-file> <database-path>")
  .option("-w, --watch", "Watch for file changes")
  .option("-n, --name [name]", "Name of database", "db") // default is db
  .action(function (configFile, db, cmd) {
    createDb(configFile, db, cmd.watch, cmd.name);
  });

program.parse(process.argv);
