const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx tsc --noEmit', { encoding: 'utf8' });
  fs.writeFileSync('tsc_errors.txt', "SUCCcesS:\n" + output);
} catch (error) {
  fs.writeFileSync('tsc_errors.txt', "ERROR STDOUT:\n" + error.stdout + "\nERROR STDERR:\n" + error.stderr);
}
