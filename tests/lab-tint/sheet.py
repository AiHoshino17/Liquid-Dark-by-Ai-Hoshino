import json,sys
from PIL import Image, ImageDraw
tags=sys.argv[1:]; names=['bedgirl_crop','pair_crop','banner','c12','c13','c62','c63','aigif']
data=[json.load(open(f'out_{t}.json')) for t in tags]
import base64
cw=150; ch=int(cw*64/30)
sheet=Image.new('RGB',(len(names)*(cw+4),(1+len(tags)*2)*0+ (ch+ch*len(tags)*2)+10),(16,16,16))
for i,n in enumerate(names):
    try: src=Image.open(f'src_{n}.png').convert('RGB')
    except: src=Image.new('RGB',(150,100))
    src=src.resize((cw,int(cw*src.height/src.width)))
    sheet.paste(src,(i*(cw+4),0))
    for j,d in enumerate(data):
        e=d[n]; raw=base64.b64decode(e['b64']); im=Image.frombytes('RGBA',(30,64),raw).convert('RGB').resize((cw,ch),Image.BICUBIC)
        sheet.paste(im,(i*(cw+4),ch//2+j*(ch+4)))
        # accent overlay
        im2=im.copy(); dr=ImageDraw.Draw(im2); N=e['n']; c=cw/N; r=ch/N
        for a in e['accs']:
            x=a['k']%N; y=a['k']//N; dr.rectangle([x*c+c*.25,y*r+r*.25,x*c+c*.75,y*r+r*.75],fill=tuple(a['rgb']),outline=(255,255,255))
        sheet.paste(im2,(i*(cw+4),ch//2+len(data)*(ch+4)+j*(ch+4)))
sheet.save('sheet_'+'_'.join(tags)+'.png'); print(sheet.size)
