const fs = require('fs');
const glob = require('glob');
const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');

function getRandomColor() {
  return Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
}

function getCommitForFileLine(file, line) {
  try {
    const blame = execSync(`git blame -L ${line},${line} --line-porcelain ${file}`).toString();
    const [shaLine] = blame.split('\n');
    const sha = shaLine.split(' ')[0];
    return sha;
  } catch (err) {
    console.warn(`⚠️ Failed to get commit for ${file}:${line} — ${err.message}`);
    return null;
  }
}

async function run() {
  console.log('🚀 TODO Sync Action Started');

  const summaryFile = core.getInput('summary_file') || 'TODO_SUMMARY.md';
  const token = core.getInput('github_token');
  const dryRun = core.getInput('dry_run') === 'true';
  const shouldCommit = core.getInput('commit') === 'true';

  const octokit = github.getOctokit(token);
  const context = github.context;
  const todoLabel = 'todo-md';

  const files = glob.sync('**/*.{js,ts,php,html,md,css,scss}', {
    ignore: ['node_modules/**', 'vendor/**', '.git/**', 'scripts/**']
  });

  const currentTodos = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const lines = raw.split('\n');

    lines.forEach((line, index) => {
      const todoMatch = line.match(/TODO:\s*(.*?)(?:\s+Label:\s*(.+))?$/i);
      if (todoMatch) {
        const title = todoMatch[1].trim();
        const rawLabels = todoMatch[2] || '';
        const labels = rawLabels
          .split(',')
          .map(l => l.trim().replace(/[.,]$/, ''))
          .filter(Boolean);

        const sha = getCommitForFileLine(file, index + 1);

        currentTodos.push({
          title,
          labels,
          file,
          line: index + 1,
          sha
        });
      }
    });
  }

  console.log(`✅ Found ${currentTodos.length} TODOs across ${files.length} files`);

  const { data: existingIssues } = await octokit.rest.issues.listForRepo({
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    per_page: 100
  });

  const allLabels = await octokit.rest.issues.listLabelsForRepo({
    owner: context.repo.owner,
    repo: context.repo.repo,
    per_page: 100
  });

  const existingLabelNames = new Set(allLabels.data.map(label => label.name));
  const desiredLabels = new Set([todoLabel]);

  currentTodos.forEach(todo => {
    todo.labels.forEach(label => desiredLabels.add(label));
  });

  for (const label of desiredLabels) {
    if (!existingLabelNames.has(label) && !dryRun) {
      await octokit.rest.issues.createLabel({
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: label,
        color: getRandomColor(),
        description: 'Autocreated label from TODO comment'
      });

      console.log(`🎨 Created label: ${label}`);
    }
  }

  const trackedIssues = existingIssues.filter(issue =>
    issue.labels.some(label => label.name === todoLabel)
  );

  for (const todo of currentTodos) {
    const exists = trackedIssues.some(issue => issue.title === todo.title);
    if (exists) continue;

    const commitLink = todo.sha
      ? ` ([view commit](https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${todo.sha}))`
      : '';

    const issueBody = [
      'Imported from TODO comment in source code.',
      '',
      `**File:** \`${todo.file}\``,
      `**Line:** ${todo.line}`,
      todo.sha ? `**Commit:** \`${todo.sha}\`${commitLink}` : ''
    ].filter(Boolean).join('\n');

    const issueLabels = [todoLabel, ...todo.labels];

    if (!dryRun) {
      const newIssue = await octokit.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: todo.title,
        body: issueBody
      });

      await octokit.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: newIssue.data.number,
        labels: issueLabels
      });

      console.log(`🆕 Created issue: ${newIssue.data.html_url}`);
    } else {
      console.log(`🧪 DRY RUN: Would create issue for "${todo.title}" with labels [${issueLabels.join(', ')}]`);
    }
  }

  // Close removed TODOs
  for (const issue of trackedIssues) {
    const stillExists = currentTodos.some(todo => todo.title === issue.title);
    if (!stillExists) {
      if (!dryRun) {
        await octokit.rest.issues.update({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issue.number,
          state: 'closed'
        });
        console.log(`❌ Closed issue: "${issue.title}"`);
      } else {
        console.log(`🧪 DRY RUN: Would close issue: "${issue.title}"`);
      }
    }
  }

  // Generate Markdown Summary
  const grouped = {};

  for (const todo of currentTodos) {
    const labels = todo.labels.length ? todo.labels : ['uncategorized'];
    labels.forEach(label => {
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(todo);
    });
  }

  let summary = '# 📋 TODO Summary\n\n';

  for (const [label, todos] of Object.entries(grouped)) {
    summary += `## ${label}\n`;
    for (const t of todos) {
      const commitNote = t.sha
        ? ` ([commit](https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${t.sha}))`
        : '';
      summary += `- [ ] ${t.title} (in \`${t.file}\`, line ${t.line})${commitNote}\n`;
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
}

run().catch(err => core.setFailed(err.message));
