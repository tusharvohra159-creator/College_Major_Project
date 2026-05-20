const { execSync } = require('child_process');
const fs = require('fs');

try {
  const add = execSync('git add .', { encoding: 'utf-8' });
  const commit = execSync('git commit -m "Update execution engine"', { encoding: 'utf-8' });
  const push = execSync('git push origin main', { encoding: 'utf-8' });
  fs.writeFileSync('git_result.txt', add + '\n' + commit + '\n' + push);
} catch (e) {
  fs.writeFileSync('git_result.txt', 'Error: ' + e.message + '\nStdout: ' + (e.stdout ? e.stdout.toString() : '') + '\nStderr: ' + (e.stderr ? e.stderr.toString() : ''));
}
