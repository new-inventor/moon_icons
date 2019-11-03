#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
var extract = require('extract-zip');

const rootDir = process.cwd();
const zipDir = path.resolve(path.normalize(process.argv[2]));
if (!zipDir) {
  throw Error('You must specify path to zip archive downloaded from icomoon.io');
}

const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'moon_icons.cfg.json'), 'utf8'));
config.srcDir = path.resolve(path.normalize(config.srcDir));
config.fontsDir = path.resolve(path.normalize(config.fontsDir));
config.iconsVariablesFilePath = path.resolve(path.normalize(config.iconsVariablesFilePath));
config.tempDir = path.join(path.resolve(path.normalize(config.tempDir)), 'extracted');

extract(zipDir, {dir: config.tempDir}, function (err) {
  if (err) {
    console.error(err);
    return;
  }
  const eotFontPath = path.join(config.fontsDir, 'icon-font.eot');
  const svgFontPath = path.join(config.fontsDir, 'icon-font.svg');
  const ttfFontPath = path.join(config.fontsDir, 'icon-font.ttf');
  const woffFontPath = path.join(config.fontsDir, 'icon-font.woff');
  if (fs.existsSync(eotFontPath)) {
    fs.unlinkSync(eotFontPath);
  }
  if (fs.existsSync(svgFontPath)) {
    fs.unlinkSync(svgFontPath);
  }
  if (fs.existsSync(ttfFontPath)) {
    fs.unlinkSync(ttfFontPath);
  }
  if (fs.existsSync(woffFontPath)) {
    fs.unlinkSync(woffFontPath);
  }
  fs.copyFileSync(path.join(config.tempDir, 'fonts', 'icomoon.eot'), eotFontPath);
  fs.copyFileSync(path.join(config.tempDir, 'fonts', 'icomoon.svg'), svgFontPath);
  fs.copyFileSync(path.join(config.tempDir, 'fonts', 'icomoon.ttf'), ttfFontPath);
  fs.copyFileSync(path.join(config.tempDir, 'fonts', 'icomoon.woff'), woffFontPath);
  console.info('\x1b[33mFonts\x1b[30m: \x1b[32mcopied\x1b[30m.');
  const projectPath = path.join(rootDir, 'icomoon_project.json');
  if (fs.existsSync(projectPath)) {
    fs.unlinkSync(projectPath);
  }
  fs.copyFileSync(path.join(config.tempDir, 'selection.json'), projectPath);
  console.info('\x1b[33mIcomoon.io project\x1b[30m: \x1b[32mcopied\x1b[30m.');

  const icomoonCSS = fs.readFileSync(path.join(config.tempDir, 'style.css'), 'utf8');
  const matches = Array.from(icomoonCSS.matchAll(/\.icon-([\w-]+):\w+.*?content(: [^;]+)/iusg));

  let projectCSS;
  if (fs.existsSync(config.iconsVariablesFilePath)) {
    projectCSS = fs.readFileSync(config.iconsVariablesFilePath, 'utf8');
  }
  let replacement = '$icons = {\n';
  for (let key in matches) {
    replacement += `        ${matches[key][0]}: ${matches[key][1]},\n`;
  }
  replacement += '};';
  if (fs.existsSync(config.iconsVariablesFilePath)) {
    projectCSS = projectCSS.replace(/$icons = \{.*?\};/iusg, replacement);
    fs.writeFileSync(config.iconsVariablesFilePath, projectCSS);
  } else {
    fs.writeFileSync(config.iconsVariablesFilePath, replacement);
  }
  console.info('\x1b[33mIcons content\x1b[30m: \x1b[32mcopied\x1b[30m.');

  fs.removeSync(config.tempDir);
  console.info('\x1b[33mTemp folder\x1b[30m: \x1b[32mremoved\x1b[30m.');
  console.info('\x1b[32mDone\x1b[30m.');
});