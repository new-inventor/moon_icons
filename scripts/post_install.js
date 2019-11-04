#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const package_name = process.env.npm_package_name;

const defaultConfig = {
  "tempDir": "temp",
  "projectFilePath": "icomoon_project.json",
  "zip": {
    "projectPath": "selection.json",
    "font": {
      "fontsDir": "fonts",
      "fontsName": "icomoon",
      "stylesPath": "style.css"
    },
    "sprite": {
      "spritePath": "symbol-defs.svg"
    }
  },
  "font": {
    "fontsDir": "public/fonts",
    "fontsName": "icon-font",
    "iconsVariablesFilePath": "src/assets/styles/modules/_variables.styl"
  },
  "sprite": {
    "imagesDir": "public/img",
    "spriteName": "icons-sprite"
  }
};

if (path.basename(process.env.INIT_CWD) !== package_name) {
  const cfg_path = path.join(process.env.INIT_CWD, package_name + '.cfg.json');
  if (fs.existsSync(cfg_path)) {
    return;
  }
  fs.writeFileSync(
    cfg_path,
    JSON.stringify(defaultConfig)
  );
  const ignore_file = path.join(process.env.INIT_CWD, '.gitignore');
  const text = fs.readFileSync(ignore_file, 'utf8');
  if (!text.match(new RegExp(`${package_name}\.cfg.*\.json`, 'img'))) {
    fs.appendFileSync(path.join(process.env.INIT_CWD, '.gitignore'), `\n${package_name}.cfg*.json`);
  }
}
