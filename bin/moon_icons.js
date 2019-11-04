#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const extract = require('extract-zip');

function removeFile(path) {
  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
}

function copyFile(from, to) {
  removeFile(to);
  fs.copyFileSync(from, to);
}

function processSprite(config, style) {
  config.imgDir = path.resolve(path.normalize(config.imgDir));

  copyFile(path.join(config.tempDir, config.zip.spritePath), path.join(config.imgDir, `${config.spriteName}.svg`));
  console.info('\x1b[33mSprite\x1b[30m: \x1b[32mcopied\x1b[30m.');
}

function processFont(config, style) {
  const fontsDir = path.join(config.cfgDir, path.normalize(config.fontsDir));
  copyFile(path.join(config.tempDir, config.zip.fontsDir, config.zip.fontsName + '.eot'), path.join(fontsDir, `${config.fontsName}.eot`));
  copyFile(path.join(config.tempDir, config.zip.fontsDir, config.zip.fontsName + '.svg'), path.join(fontsDir, `${config.fontsName}.svg`));
  copyFile(path.join(config.tempDir, config.zip.fontsDir, config.zip.fontsName + '.ttf'), path.join(fontsDir, `${config.fontsName}.ttf`));
  copyFile(path.join(config.tempDir, config.zip.fontsDir, config.zip.fontsName + '.woff'), path.join(fontsDir, `${config.fontsName}.woff`));
  console.info('\x1b[33mFonts\x1b[30m: \x1b[32mcopied\x1b[30m.');

  const icomoonCSS = fs.readFileSync(path.join(config.tempDir, config.zip.stylesPath), 'utf8');
  const matches = Array.from(icomoonCSS.matchAll(/\.icon-([\w-]+):\w+.*?content: ([^;]+)/iusg));
  const iconsStyle = getIconsStyle(matches, style);
  const iconsVariablesFilePath = path.join(config.cfgDir, path.normalize(config.iconsVariablesFilePath));
  fs.writeFileSync(iconsVariablesFilePath, iconsStyle);
  console.info('\x1b[33mIcons styles\x1b[30m: \x1b[32mprocessed\x1b[30m.');
}

function getIconsStyle(matches, style) {
  if (style === 'stylus') {
    let replacement = '$icons = {\n';
    for (let key in matches) {
      replacement += `        ${matches[key][1]}: ${matches[key][2]},\n`;
    }
    replacement += '};';
    return replacement;
  } else if (style === 'scss' || style === 'sass') {
    let replacement = '$icons: (\n';
    for (let key in matches) {
      replacement += `        ${matches[key][1]}: ${matches[key][2]},\n`;
    }
    replacement += ');';
    return replacement;
  } else if (style === 'less') {
    let replacement = '@icons: {\n';
    for (let key in matches) {
      replacement += `        ${matches[key][1]}: ${matches[key][2]};\n`;
    }
    replacement += ')';
    return replacement;
  }
}

function processArchive(userConfig) {
  const cfgPath = path.resolve(path.normalize(userConfig.configPath));
  const cfgDir = path.dirname(cfgPath);
  const config = getConfig(cfgPath);
  if (!config) {
    return;
  }

  extract(userConfig.zipDir, {dir: config.tempDir}, function (err) {
    if (err) {
      console.error("\x1b[31mError\x1b[30m(while unzip): " + err.message);
      return;
    }
    copyFile(path.join(config.tempDir, config.zip.projectPath), path.join(cfgDir, config.projectFilePath));
    console.info('\x1b[33mIcomoon.io project\x1b[30m: \x1b[32mcopied\x1b[30m.');

    if (userConfig.type === 'svg-sprite') {
      processSprite({
        ...config.sprite,
        tempDir: config.tempDir,
        zip: config.zip.sprite,
        cfgDir: cfgDir
      }, userConfig.style);
    } else if (userConfig.type === 'font') {
      processFont({...config.font, tempDir: config.tempDir, zip: config.zip.font, cfgDir: cfgDir}, userConfig.style);
    }

    fs.removeSync(config.tempDir);
    console.info('\x1b[33mTemp folder\x1b[30m: \x1b[32mremoved\x1b[30m.');
    console.info('\x1b[32mDone\x1b[30m.');
  });
}

function getConfig(cfgPath) {
  if (!fs.existsSync(cfgPath)) {
    console.error(`\x1b[31mError\x1b[30m: Config file "${cfgPath}" does not exists. Make sure that you created it.`);
    return;
  }
  const cfgDir = path.dirname(cfgPath);
  const config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  config.tempDir = path.join(cfgDir, path.normalize(config.tempDir), 'icons_extracted');
  return config;
}

const argv = require('yargs') // eslint-disable-line
  .command('$0 <path>', 'update project icons from icomoon.io zip archive', (yargs) => {
    yargs
      .positional('path', {
        type: 'string',
        describe: 'Path to zip archive',
        normalize: true,
        skipValidation: true,
      })
      .option('svg-sprite', {
        alias: 's',
        type: 'boolean',
        description: 'Get icons as svg sprite (default, if no type specified)'
      })
      .option('font', {
        alias: 'f',
        type: 'boolean',
        description: 'Get icons as font'
      })
      .option('style', {
        type: 'string',
        choices: ['less', 'scss', 'sass', 'stylus'],
        default: 'stylus',
        description: 'Style type for provide needed variables styles'
      })
      .option('config', {
        type: 'string',
        default: 'moon_icons.cfg.json',
        description: 'Path to config file'
      })
      .conflicts('s', 'f')
      .demandOption(['path'], 'Please, provide path to zip archive.')
  }, (argv) => {
    processArchive({
      zipDir: path.resolve(argv.path),
      type: argv['svg-sprite'] || !argv['svg-sprite'] && !argv['font']
        ? 'svg-sprite'
        : 'font',
      style: argv.style,
      configPath: argv.config
    });
  })
  .version('1.0.0')
  .recommendCommands()
  .argv;
