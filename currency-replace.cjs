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
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace standalone $ with ₹, ensuring we don't break string literals or variable names
    // Typically in this code, it's >$< or >${
    content = content.replace(/>\$/g, '>₹');
    content = content.replace(/"\$"/g, '"₹"');
    content = content.replace(/'\$'/g, "'₹'");
    content = content.replace(/`\$/g, '`₹'); // In case of template literals

    // For things like <p>${...}</p> we should replace `>$` but if it's template string `${...}` we shouldn't break JS syntax
    // Wait, in JSX: <p>${getTotalCartAmount()}</p> is actually literal $ followed by {getTotalCartAmount()}
    // So >$ will match >$ and become >₹, which is correct!
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Currency replaced successfully.');
