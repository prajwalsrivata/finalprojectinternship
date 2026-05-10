const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Primary Color Replacements
    content = content.replace(/tomato/gi, 'var(--primary-color)');
    content = content.replace(/#ff6b35/gi, 'var(--primary-color)');
    content = content.replace(/#e55a2b/gi, 'var(--primary-color)');
    
    // Text Primary Replacements
    content = content.replace(/#49557e/gi, 'var(--text-primary)');
    content = content.replace(/color:\s*black/gi, 'color: var(--text-primary)');
    content = content.replace(/color:\s*#000/gi, 'color: var(--text-primary)');
    content = content.replace(/color:\s*#262626/gi, 'color: var(--text-primary)');
    
    // Text Secondary Replacements
    content = content.replace(/#676767/gi, 'var(--text-secondary)');
    content = content.replace(/#595959/gi, 'var(--text-secondary)');
    content = content.replace(/#555/gi, 'var(--text-secondary)');
    content = content.replace(/color:\s*gray/gi, 'color: var(--text-secondary)');
    
    // Surface Replacements
    content = content.replace(/background-color:\s*#fff4f2/gi, 'background-color: var(--surface-color)');
    content = content.replace(/background-color:\s*#fff2ef/gi, 'background-color: var(--surface-color)');
    content = content.replace(/background:\s*#f5f5f5/gi, 'background: var(--surface-color)');
    content = content.replace(/background-color:\s*white/gi, 'background-color: var(--surface-color)');
    content = content.replace(/background:\s*white/gi, 'background: var(--surface-color)');
    content = content.replace(/background-color:\s*#ffe1e1/gi, 'background-color: var(--surface-color)');
    
    // Borders
    content = content.replace(/border:\s*1px solid #d4d4d4/gi, 'border: 1px solid var(--surface-color)');
    
    // Specific fixes
    content = content.replace(/color:\s*white/gi, 'color: var(--text-primary)');
    content = content.replace(/color:\s*#747477/gi, 'color: var(--text-primary)');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Theme updated successfully.');
