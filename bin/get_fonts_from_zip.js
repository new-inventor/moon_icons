#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
var extract = require('extract-zip');

const rootDir = process.cwd();
const zipDir = path.resolve(path.normalize(process.argv[2]));
if (!zipDir) {
  throw Error('You must specify path to zip archive downloaded from icomoon.io');
}
console.log(zipDir);

const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'moon_icons.cfg.json'), 'utf8'));
config.srcDir = path.resolve(path.normalize(config.srcDir));
config.fontsDir = path.resolve(path.normalize(config.fontsDir));
config.iconsVariablesFilePath = path.resolve(path.normalize(config.iconsVariablesFilePath));
config.tempDir = path.join(path.resolve(path.normalize(config.tempDir)), 'extracted');
console.log(config.tempDir);

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
  const projectPath = path.join(rootDir, 'icomoon_project.json');
  if (fs.existsSync(projectPath)) {
    fs.unlinkSync(projectPath);
  }
  fs.copyFileSync(path.join(config.tempDir, 'selection.json'), projectPath);

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

  fs.rmdirSync(config.tempDir, {recursive: true});
});