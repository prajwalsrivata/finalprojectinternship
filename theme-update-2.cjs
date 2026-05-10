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
    
    // More text replacements
    content = content.replace(/#454545/gi, 'var(--text-primary)');
    content = content.replace(/#c5c5c5/gi, 'var(--text-secondary)');
    content = content.replace(/#808080/gi, 'var(--text-secondary)');
    content = content.replace(/#d9d9d9/gi, 'var(--text-primary)');
    content = content.replace(/#747474/gi, 'var(--text-secondary)');
    
    // Accents
    content = content.replace(/#c41e3a/gi, 'var(--primary-color)');
    
    // Backgrounds
    content = content.replace(/background:\s*black/gi, 'background: var(--surface-color)');
    content = content.replace(/background-color:\s*#323232/gi, 'background-color: var(--surface-color)');
    content = content.replace(/background-color:\s*#e2e2e2/gi, 'background-color: var(--surface-color)');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Second pass updated successfully.');
