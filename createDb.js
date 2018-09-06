const fs = require("fs");
const matter = require("gray-matter");
const chokidar = require("chokidar");
const path = require("path");
const low = require("lowdb");
const yaml = require("js-yaml");
const FileSync = require("lowdb/adapters/FileSync");
const ora = require("ora");

const locateSpinner = ora("Locating config file...");
const initDbSpinner = ora("Creating database...");
const markdownSpinner = ora("Adding content from markdown files...");

module.exports = function initConfig(configPath, dbPath, isWatching, dbName) {
  let config;
  try {
    locateSpinner.stop();
    config = yaml.safeLoad(fs.readFileSync(configPath + "/config.yml", "utf8"));
    locateSpinner.clear();
  } catch (err) {
    return locateSpinner.fail(
      `Ops! Could not locate Netlify config file. Please make sure you are referencing the correct path`
    );
  }

  initDbSpinner.start();
  const adapter = new FileSync(dbPath + `/${dbName}.json`);
  const db = low(adapter);

  initDatabase(config.collections);

  markdownSpinner.start();
  if (isWatching) {
    watchFromMarkdown(config.collections);
    markdownSpinner.info("Watching for changes in markdown files...");
  } else {
    generateFromMarkdown(config.collections);
    markdownSpinner.stop();
  }

  function initDatabase(collections) {
    initDbSpinner.color = "yellow";
    const emptyDB = collections.reduce((acc, { name }) => {
      return { ...acc, [name]: [] };
    }, {});
    db.defaults(emptyDB).write();
    db.setState(emptyDB).write();
    initDbSpinner.succeed("Created database!");
  }

  function generateFromMarkdown(collections) {
    collections.forEach(({ folder, name }) => {
      fs.readdirSync(folder).forEach(file => {
        if (path.extname(file) === ".md") {
          addContent(folder + "/" + file, name);
        }
      });
    });
  }

  function watchFromMarkdown(collections) {
    collections.forEach(({ folder, name }) => {
      chokidar
        .watch(folder + "/**.md")
        .on("add", path => addContent(path, name))
        .on("change", path => replaceContent(path, name))
        .on("unlink", path => deleteContent(path, name));
    });
  }

  function addContent(filePath, name) {
    const { path, data } = matter.read(filePath);
    db.get(name)
      .push({ path, ...data })
      .write();
  }

  function replaceContent(filePath, name) {
    const file = matter.read(filePath);
    db.get(name)
      .find({ path: filePath })
      .assign(file)
      .write();
  }

  function deleteContent(filePath, name) {
    db.get(name)
      .remove({ path: filePath })
      .write();
  }
};
