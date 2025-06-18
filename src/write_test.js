const fs = require('fs');

fs.writeFileSync('src/WRITE_TEST.txt', 'File system write test successful!\n');
console.log('✅ Successfully wrote to src/WRITE_TEST.txt');
