const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../frontend/src/data/insightsData.ts');
let content = fs.readFileSync(dataFile, 'utf8');

const LINKS = [
  { keyword: 'background removal', url: '/services/background-removal' },
  { keyword: 'clipping path', url: '/services/clipping-path' },
  { keyword: 'ghost mannequin', url: '/services/ghost-mannequin' },
  { keyword: 'color correction', url: '/services/color-correction' },
  { keyword: 'shadow creation', url: '/services/shadow-creation' },
  { keyword: 'jewelry retouching', url: '/services/jewelry-retouching' },
  { keyword: 'fashion retouching', url: '/services/fashion-retouching' },
  { keyword: 'AI product photography', url: '/services/ai-product-visuals' },
  { keyword: 'bulk product photo editing', url: '/services/bulk-product-photo-editing' },
];

let modified = false;

// We process chunk by chunk or using a simple replace loop per keyword
for (const link of LINKS) {
  // Regex to match the keyword NOT inside a markdown link [keyword](url) 
  // We can do this safely by matching the keyword only if it's not preceded by [ and followed by ]
  // A robust approach for basic markdown:
  // Split by markdown link, replace inside text nodes, then join.
  
  const chunks = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  for (let i = 0; i < chunks.length; i++) {
    // Even indices are text outside markdown links.
    if (i % 2 === 0) {
      const regex = new RegExp(`(?<!\\-)(?<!\\#)(?<!\\[)\\b(${link.keyword})\\b(?!\\])(?!\\-)`, 'gi');
      
      let replacedInChunk = false;
      const newChunk = chunks[i].replace(regex, (match) => {
        // Only replace the FIRST occurrence per chunk to avoid over-linking
        if (!replacedInChunk) {
          replacedInChunk = true;
          return `[${match}](${link.url})`;
        }
        return match;
      });

      if (chunks[i] !== newChunk) {
        chunks[i] = newChunk;
        modified = true;
      }
    }
  }
  content = chunks.join('');
}

if (modified) {
  fs.writeFileSync(dataFile, content, 'utf8');
  console.log('Successfully injected internal links into insightsData.ts!');
} else {
  console.log('No modifications needed.');
}
