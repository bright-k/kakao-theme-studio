"""Import a local official source sample's identifiers and PNG sizes, never its artwork.
Usage: python3 scripts/import-profile.py /path/to/research/kakaotalk-theme
"""
from pathlib import Path
import re, json, struct, sys

base = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
css = re.sub(r'/\*.*?\*/', '', (base/'ios-sample-26.9.0/KakaoTalkTheme.css').read_text(), flags=re.S)
props = []
for selector, body in re.findall(r'([\w-]+)\s*\{([^}]+)\}', css):
    for name, value in re.findall(r'([\w-]+)\s*:\s*([^;]*);', body):
        value = value.strip()
        kind = 'image' if '.png' in value else 'color' if 'color' in name else 'number' if 'alpha' in name else 'insets' if 'edgeinsets' in name else 'text'
        if '.png' in value and re.search(r'\d+px', value): kind = 'stretch'
        props.append(dict(id=selector+'/'+name, selector=selector, name=name, default=value, kind=kind, editable=selector!='ManifestStyle' and kind!='image'))
props.append(dict(id='ManifestStyle/-kakaotalk-theme-style', selector='ManifestStyle', name='-kakaotalk-theme-style', default="'light'", kind='text', editable=False, source='guide'))
colors = [dict(id=n, default=v) for n,v in re.findall(r'<color name="([^"]+)">([^<]+)', (base/'android-sample-26.9.0/src/main/theme/values/colors.xml').read_text())]
files = []
for platform,prefix,folder in [('ios','ios/Images',base/'ios-sample-26.9.0/Images'),('android','android/res',base/'android-sample-26.9.0/src/main/theme')]:
    for p in sorted(folder.rglob('*.png')):
        w,h = struct.unpack('>II', p.read_bytes()[16:24])
        files.append(dict(path=prefix+'/'+str(p.relative_to(folder)),platform=platform,fileName=p.name,width=w,height=h,ninePatch=p.name.endswith('.9.png'),source='sample'))
for n in range(1,4):
    for folder,name,size in [('drawable-xxhdpi',f'theme_profile_0{n}_image.png',220),('drawable-nodpi',f'theme_profile_0{n}_image_full.png',320)]:
        key=f'android/res/{folder}/{name}'
        if not any(f['path']==key for f in files): files.append(dict(path=key,platform='android',fileName=name,width=size,height=size,ninePatch=False,source='guide'))
files.append(dict(path='android/res/drawable/icon.png',platform='android',fileName='icon.png',width=144,height=144,ninePatch=False,source='guide'))
for f in list(files):
    if f['platform']=='ios' and '@3x' in f['path']:
        key=f['path'].replace('@3x','@2x')
        if not any(g['path']==key for g in files): files.append({**f,'path':key,'fileName':f['fileName'].replace('@3x','@2x'),'width':round(f['width']*2/3),'height':round(f['height']*2/3),'source':'tool-scale'})
obj=dict(profile='kakaotalk-26.9.0',sourceUrl='https://t1.kakaocdn.net/kakaotalk_theme/kakaotalk_theme_user_guide.zip',archiveSha256='82c0cf80993072d855010a9e3a8eb03281f70da3af287e54526f59a05ab308df',scope='26.9.0 official sample plus identified documented optional resources; actual KakaoTalk application unverified',iosProperties=props,androidColors=colors,files=sorted(files,key=lambda f:f['path']))
(root/'templates/profile-26.9.0.json').write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print('iOS properties:',len(props),'Android colors:',len(colors),'sample PNG:',sum(f['source']=='sample' for f in files),'supported file slots:',len(files))
