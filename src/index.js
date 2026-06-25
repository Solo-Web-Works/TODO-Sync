const fs = require('fs');
const glob = require('glob');
const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

function getRandomColor() {
  return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

// Restore original run function with Blade fix and robust summary writing
async function run() {
  console.log('🚀 TODO Sync Action Started');
  // Allow local testing by using environment variables if core.getInput is not set
  const getInput = (name, fallback) => {
    try {
      return core.getInput(name) || process.env[name.toUpperCase()] || fallback;
    } catch {
      return process.env[name.toUpperCase()] || fallback;
    }
  };
  const summaryFile = getInput('summary_file', 'TODO_SUMMARY.md');
  const token = getInput('github_token');
  const dryRun = getInput('dry_run', 'false') === 'true';
  const shouldCommit = getInput('commit', 'true') === 'true';
  const prefixesRaw = getInput('prefixes', 'TODO,FIXME,HACK,BUG,NOTE');
  const prefixes = prefixesRaw.split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  const prefixPattern = prefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const todoRegex = new RegExp(`(${prefixPattern}):\\s*(.*?)(?:\\s+Label:\\s*(.+))?$`, 'i');
  let summary = '';
  let currentTodos = [];
  try {
    const octokit = github.getOctokit(token);
    const context = github.context;
    const todoLabel = 'todo-md';
    const files = glob.sync('**/*.{js,ts,php,html,ejs,md,css,scss,blade.php}', {
      ignore: ['node_modules/**', 'vendor/**', '.git/**', 'scripts/**']
    });
    currentTodos = [];
    for (const file of files) {
      const raw = fs.readFileSync(file, 'utf8');
      const lines = raw.split('\n');
      lines.forEach((line, index) => {
        const todoMatch = line.match(todoRegex);
        if (todoMatch) {
          const prefix = todoMatch[1].toUpperCase();
          let title = todoMatch[2].trim();
          // Remove trailing Blade comment ending if present
          title = title.replace(/\s*--}}\s*$/, '');
          // Remove trailing HTML comment ending if present
          title = title.replace(/\s*--!?>\s*$/, '');
          const rawLabels = (todoMatch[3] || '').replace(/\s*--}}\s*$/, '').replace(/\s*--!?>\s*$/, '');
          const labels = rawLabels
            .split(',')
            .map(l => l.trim().replace(/[.,]$/, ''))
            .filter(Boolean);
          let sha = null;
          try {
            sha = getCommitForFileLine(file, index + 1);
          } catch {}
          currentTodos.push({
            prefix,
            title,
            labels,
            file,
            line: index + 1,
            sha
          });
        }
      });
    }
    console.log(`✅ Found ${currentTodos.length} tagged comments (${prefixes.join(', ')}) across ${files.length} files`);

    // Build summary
    const grouped = {};

    for (const todo of currentTodos) {
      const labels = todo.labels.length ? todo.labels : ['uncategorized'];
      labels.forEach(label => {
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(todo);
      });
    }

    summary = '# 📋 TODO Summary\n\n';

    for (const [label, todos] of Object.entries(grouped)) {
      summary += `## ${label}\n`;
      for (const t of todos) {
        const commitNote = t.sha
          ? ` ([commit](https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${t.sha}))`
          : '';
        summary += `- [ ] **[${t.prefix}]** ${t.title} (in \`${t.file}\`, line ${t.line})${commitNote}\n`;
      }
      summary += '\n';
    }

    fs.writeFileSync(summaryFile, summary);
    console.log(`📝 Wrote TODO summary to ${summaryFile}`);
    if (shouldCommit && !dryRun) {
      execSync('git config user.name "github-actions[bot]"');
      execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
      execSync(`git add ${summaryFile}`);
      execSync('git commit -m "chore(todo): update TODO summary"');
      execSync('git push');
      console.log('🚀 Committed and pushed summary');
    } else {
      console.log(`🧪 DRY RUN or commit=false: Skipped auto-commit`);
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

run().catch(err => core.setFailed(err.message));
