#!/usr/bin/env python3

from zipfile import ZipFile
import os
import argparse
import re

import shutil

parser = argparse.ArgumentParser()
parser.add_argument('file_path', type=str, help='path to icomoon archive.')
args = parser.parse_args()

file_dir = os.path.abspath(os.path.dirname(__file__))
fonts_path = os.path.join(os.path.dirname(file_dir), 'public', 'fonts')
styles_path = os.path.join(os.path.dirname(file_dir), 'src', 'sass', 'icons', '_variables.scss')
extract_path = os.path.join(file_dir, 'extracted')


with ZipFile(args.file_path, 'r') as f:
    f.extractall(extract_path)
    f.close()

os.remove(os.path.join(fonts_path, 'b2b-connect-icons.eot'))
os.remove(os.path.join(fonts_path, 'b2b-connect-icons.svg'))
os.remove(os.path.join(fonts_path, 'b2b-connect-icons.ttf'))
os.remove(os.path.join(fonts_path, 'b2b-connect-icons.woff'))
shutil.copy2(os.path.join(extract_path, 'fonts', 'icomoon.eot'), os.path.join(fonts_path, 'b2b-connect-icons.eot'))
shutil.copy2(os.path.join(extract_path, 'fonts', 'icomoon.svg'), os.path.join(fonts_path, 'b2b-connect-icons.svg'))
shutil.copy2(os.path.join(extract_path, 'fonts', 'icomoon.ttf'), os.path.join(fonts_path, 'b2b-connect-icons.ttf'))
shutil.copy2(os.path.join(extract_path, 'fonts', 'icomoon.woff'), os.path.join(fonts_path, 'b2b-connect-icons.woff'))
os.remove(os.path.join(os.path.dirname(file_dir), 'icons-project.json'))
shutil.copy2(os.path.join(extract_path, 'selection.json'), os.path.join(os.path.dirname(file_dir), 'icons-project.json'))

with open(os.path.join(extract_path, 'style.css'), 'r') as f:
    content = f.read()
    res = re.findall('\.icon-([\w-]+):\w+.*?content(: [^;]+)', content, flags=re.S|re.I)
    with open(styles_path, 'r') as fr:
        content = fr.read()
        fr.close()
        replacement = '$icons: (\n'
        for g in res:
            replacement += '        ' + g[0] + g[1] + ',\n'
        replacement += ');'
        res = re.sub('\$icons: \(.*?\);', replacement, content, flags=re.S|re.I)
        with open(styles_path, 'w') as fw:
            fw.write(res)
            fw.close()
    f.close()

shutil.rmtree(extract_path)
