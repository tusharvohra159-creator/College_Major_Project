const { execSync } = require('child_process');

try {
  console.log(execSync('git status', { encoding: 'utf-8' }));
} catch (e) {
  console.error(e.message);
}
