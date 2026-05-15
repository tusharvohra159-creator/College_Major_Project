const fs = require('fs');
const { spawn, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Map of running processes keyed by socket ID
const activeProcesses = new Map();
const activeTimeouts = new Map();

const TIMEOUT_DURATION = 60000; // 60 seconds for interactive typing

function resetTimeout(socket) {
  if (activeTimeouts.has(socket.id)) {
    clearTimeout(activeTimeouts.get(socket.id));
  }
  
  const timeoutId = setTimeout(() => {
    if (activeProcesses.has(socket.id)) {
      const proc = activeProcesses.get(socket.id);
      proc.kill();
      socket.emit('execute_output', { type: 'stderr', output: `\nExecution timed out (${TIMEOUT_DURATION/1000}s limit).` });
    }
  }, TIMEOUT_DURATION);

  activeTimeouts.set(socket.id, timeoutId);
}

function clearSocketTimeout(socket) {
  if (activeTimeouts.has(socket.id)) {
    clearTimeout(activeTimeouts.get(socket.id));
    activeTimeouts.delete(socket.id);
  }
}

function setupInteractiveExecution(socket) {
  socket.on('execute_start', async ({ code, language_id }) => {
    // If a process is already running for this socket, kill it
    if (activeProcesses.has(socket.id)) {
      activeProcesses.get(socket.id).kill();
      activeProcesses.delete(socket.id);
      clearSocketTimeout(socket);
    }

    const id = crypto.randomBytes(16).toString('hex');
    const runDir = path.join(os.tmpdir(), `run_${id}`);
    fs.mkdirSync(runDir, { recursive: true });

    const langIdStr = String(language_id).toLowerCase();
    let command;
    let args = [];
    
    try {
      if (langIdStr.includes('python')) {
        const codeFile = path.join(runDir, `script.py`);
        fs.writeFileSync(codeFile, code);
        command = 'python3';
        args = ['-u', codeFile]; // -u for unbuffered output
      }
      else if (langIdStr.includes('javascript') || langIdStr.includes('node')) {
        const codeFile = path.join(runDir, `script.js`);
        fs.writeFileSync(codeFile, code);
        command = 'node';
        args = [codeFile];
      }
      else if (langIdStr.includes('cpp') || langIdStr === 'c++') {
        const codeFile = path.join(runDir, `main.cpp`);
        const outFile = path.join(runDir, `a.out`);
        fs.writeFileSync(codeFile, code);
        
        try {
          execSync(`g++ ${codeFile} -o ${outFile}`);
        } catch (err) {
          socket.emit('execute_output', { type: 'stderr', output: err.stderr ? err.stderr.toString() : 'Compilation failed.' });
          socket.emit('execute_end', { code: 1 });
          return;
        }
        command = outFile;
      }
      else if (langIdStr.includes('c')) {
        const codeFile = path.join(runDir, `main.c`);
        const outFile = path.join(runDir, `a.out`);
        fs.writeFileSync(codeFile, code);
        
        try {
          execSync(`gcc ${codeFile} -o ${outFile}`);
        } catch (err) {
          socket.emit('execute_output', { type: 'stderr', output: err.stderr ? err.stderr.toString() : 'Compilation failed.' });
          socket.emit('execute_end', { code: 1 });
          return;
        }
        command = outFile;
      }
      else if (langIdStr.includes('java')) {
        const match = code.match(/class\s+([A-Za-z0-9_]+)/);
        const className = match ? match[1] : 'Main';
        const codeFile = path.join(runDir, `${className}.java`);
        fs.writeFileSync(codeFile, code);
        
        try {
          execSync(`javac ${codeFile}`);
        } catch (err) {
          socket.emit('execute_output', { type: 'stderr', output: err.stderr ? err.stderr.toString() : 'Compilation failed.' });
          socket.emit('execute_end', { code: 1 });
          return;
        }
        command = 'java';
        args = [className];
      }
      else {
        socket.emit('execute_output', { type: 'stderr', output: `Unsupported language: ${language_id}` });
        socket.emit('execute_end', { code: 1 });
        return;
      }

      const child = spawn(command, args, { cwd: runDir });
      activeProcesses.set(socket.id, child);

      child.stdout.on('data', (data) => {
        socket.emit('execute_output', { type: 'stdout', output: data.toString() });
      });

      child.stderr.on('data', (data) => {
        socket.emit('execute_output', { type: 'stderr', output: data.toString() });
      });

      child.on('close', (exitCode) => {
        activeProcesses.delete(socket.id);
        clearSocketTimeout(socket);
        fs.rmSync(runDir, { recursive: true, force: true });
        socket.emit('execute_end', { code: exitCode });
      });

      // Start initial timeout
      resetTimeout(socket);

    } catch (err) {
      socket.emit('execute_output', { type: 'stderr', output: err.message });
      socket.emit('execute_end', { code: 1 });
    }
  });

  socket.on('execute_input', ({ input }) => {
    if (activeProcesses.has(socket.id)) {
      const child = activeProcesses.get(socket.id);
      child.stdin.write(input + '\n');
      
      // Give the user more time after they interact
      resetTimeout(socket);
    }
  });

  socket.on('disconnect', () => {
    if (activeProcesses.has(socket.id)) {
      activeProcesses.get(socket.id).kill();
      activeProcesses.delete(socket.id);
      clearSocketTimeout(socket);
    }
  });
}

// Keeping `main` for backward compatibility with the old HTTP route if still used
async function main(code, language_id, stdin) {
  return { type: 'stderr', output: 'HTTP execution deprecated. Please use Interactive WebSocket.' };
}

module.exports = { main, setupInteractiveExecution };