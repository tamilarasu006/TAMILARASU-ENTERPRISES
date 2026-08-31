const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/controllers');
const files = fs.readdirSync(dir).map(f => path.join(dir, f));
files.push(path.join(__dirname, 'src/app.js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Add import if not present and we need to replace something
  const regex = /res\.status\((\d+)\)\.json\(\{[\s\n]*success:\s*false,[\s\n]*message:\s*(['"`].*?['"`]),[\s\n]*error:\s*([^.]+\.message|err\.message|error\.message)[\s\n]*\}\);?/g;
  
  if (regex.test(content)) {
    content = content.replace(regex, (match, status, msg, errExpr) => {
      // errExpr is like error.message or err.message
      const errVar = errExpr.split('.')[0];
      return `return errorResponse(res, ${status}, ${msg}, ${errVar});`;
    });

    if (file.endsWith('app.js')) {
      content = "const errorResponse = require('./utils/errorResponse');\n" + content;
    } else {
      content = "const errorResponse = require('../utils/errorResponse');\n" + content;
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
