import json, re, pathlib
SRC=pathlib.Path('/root/.hermes-private/cache/documents/all_service_pages_extracted')
OUT=pathlib.Path('/root/reframvevisuals/frontend/src/data/servicePageContent.ts')
FILES={
'AI Product Photography':'ai-product-photography','AI Video Generation':'ai-video-generation','AI-Generated Image Refinement':'ai-generated-image-refinement','Background Removal':'background-removal','Clipping path':'clipping-path','Color Change':'color-change','Color Correction':'color-correction','Garment Retouch':'garment-retouch','Ghost Mannequin':'ghost-mannequin','Image Manipulation':'manipulation','Jewelry Retouch':'jewelry-retouch','Model Retouch':'model-retouch','Multi-Clipping Path':'multi-clipping-path','Pattern Change':'pattern-change','Raster to Vector':'raster-to-vector','Retouching':'retouching','Shadow Creation':'shadow-creation','Sketch to Image':'sketch-to-reality'}

def lines_for(stem):
    return (SRC/(stem+'.txt')).read_text(encoding='utf-8').splitlines()

def section(lines, start, stops):
    try: i=lines.index(start)+1
    except ValueError: return []
    j=len(lines)
    for s in stops:
        if s in lines[i:]: j=min(j, lines.index(s,i))
    return [x for x in lines[i:j] if x.strip()]

def pairs(lines, start, stops):
    arr=section(lines,start,stops); out=[]
    for i in range(0,len(arr)-1,2): out.append({'title':arr[i], 'desc':arr[i+1]})
    return out

def clean_bullet(x): return x.lstrip('·- ').strip()

data={}
for stem, sid in FILES.items():
    l=lines_for(stem); title=l[0]
    def after(label):
        return l[l.index(label)+1] if label in l and l.index(label)+1<len(l) else ''
    trust=section(l,'Trust Stats',['CTA'])
    price=next((x.split('—',1)[1].strip().replace('$','') for x in trust if x.startswith('Starting From')), '')
    cap=next((x.split('—',1)[1].strip() for x in trust if x.startswith('Daily Capacity')), '')
    included=[clean_bullet(x) for x in section(l,"What’s Included",["What’s Not Included"])]
    excluded=[clean_bullet(x) for x in section(l,"What’s Not Included",["How Revisions Work"])]
    faq=pairs(l,'FAQ Section',[])
    data[sid]={
        'name': title,
        'supportingLine': after('Supporting Line'),
        'seoParagraph': after('SEO Paragraph'),
        'idealFor': section(l,'Ideal For (small points)',['Trust Stats']) or section(l,'Ideal For (Small points)',['Trust Stats']),
        'priceText': price,
        'dailyCapacity': cap,
        'process': pairs(l,"How It’s Done",["What We Handle"]),
        'whatWeHandle': after('What We Handle'),
        'includes': included,
        'excludes': excluded,
        'bulkTitle': after('Bulk Section'),
        'bulkSubtitle': l[l.index('Bulk Section')+2] if 'Bulk Section' in l and l.index('Bulk Section')+2<len(l) else '',
        'bulkText': l[l.index('Bulk Section')+3] if 'Bulk Section' in l and l.index('Bulk Section')+3<len(l) else '',
        'bulkPoints': section(l,'Supporting Points',['Where it works best']),
        'whereBest': after('Where it works best'),
        'idealForText': after('Ideal for') or after('Ideal For'),
        'faqs': [{'q':x['title'],'a':x['desc']} for x in faq],
    }
OUT.write_text('export interface ServicePageContent {\n  name: string; supportingLine: string; seoParagraph: string; idealFor: string[]; priceText: string; dailyCapacity: string; process: {title:string; desc:string}[]; whatWeHandle: string; includes: string[]; excludes: string[]; bulkTitle: string; bulkSubtitle: string; bulkText: string; bulkPoints: string[]; whereBest: string; idealForText: string; faqs: {q:string; a:string}[];\n}\n\nexport const SERVICE_PAGE_CONTENT: Record<string, ServicePageContent> = '+json.dumps(data, ensure_ascii=False, indent=2)+';\n',encoding='utf-8')
print('wrote', OUT, len(data))
