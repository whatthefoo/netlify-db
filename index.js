#!/usr/bin/env node

const program = require("commander");
const createDb = require("./createDb");

program.version("0.0.1", "-v, --version");

program
  .command("create <config-path> <database-path>")
  .option("-w, --watch", "Watch for file changes")
  .option("-n, --name", "Name of database")
  .action(function(config, db, cmd) {
    createDb(config, db, cmd.watch, cmd.name);
  });

program.parse(process.argv);
