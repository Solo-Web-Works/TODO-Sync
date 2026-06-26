# TODO-Sync

TODO-Sync is a GitHub Action that automatically scans your codebase for TODO comments, creates or updates corresponding GitHub Issues, and generates a markdown summary file. This tool helps maintainers keep track of pending tasks directly from the source code, ensuring that nothing slips through the cracks.
GitHub

## ✨ Features

- Automated Issue Creation: Detects TODO comments and creates GitHub Issues accordingly.
- Issue Updating: Updates existing Issues if corresponding TODO comments are modified.
- Markdown Summary: Generates a TODO_SUMMARY.md file listing all detected comments with links to their Issues.
- Multiple Prefixes: Supports TODO, FIXME, HACK, BUG, NOTE, and any custom prefixes you configure.
- Customizable Workflow: Configure the action to run on specific events and customize its behavior through inputs.

## 📦 Installation

To integrate TODO-Sync into your repository, add the following workflow file:

```yaml
name: Sync TODOs with Issues

on:
  workflow_dispatch:
  push:
    paths-ignore:
      - '**.md'

jobs:
  sync_todos:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Sync TODOs
        uses: Solo-Web-Works/TODO-Sync@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          summary_file: TODO_SUMMARY.md
          dry_run: false
          commit: false
```

## ⚙️ Inputs

| Name           | Description                                                                            | Required | Default                    |
| -------------- | -------------------------------------------------------------------------------------- | -------- | -------------------------- |
| `github_token` | GitHub token with `repo` and `issues` scopes. Typically `${{ secrets.GITHUB_TOKEN }}`. | Yes      | N/A                        |
| `summary_file` | Path to the markdown file where the TODO summary will be written.                      | No       | `TODO_SUMMARY.md`          |
| `dry_run`      | If set to `true`, the action will simulate the process without making changes.         | No       | `false`                    |
| `commit`       | If set to `true`, the action will commit the updated summary file to the repository.   | No       | `true`                     |
| `prefixes`     | Comma-separated list of comment prefixes to scan for.                                  | No       | `TODO,FIXME,HACK,BUG,NOTE` |

## 📝 Output

After execution, the action will:

- Scan the codebase for comments matching the configured prefixes (TODO, FIXME, HACK, BUG, NOTE by default).
- Create or update GitHub Issues corresponding to each detected comment.
- Generate or update the specified markdown summary file with a list of all detected comments and links to their Issues.

## 🛠️ Example

Given the following code snippets:

```javascript
// TODO: Refactor this function to improve performance
function processData(data) {
  // ...
}

// FIXME: This causes a crash when input is null
function parseInput(input) {
  // ...
}
```

The action will:

- Create or update GitHub Issues titled "Refactor this function to improve performance" and "This causes a crash when input is null".
- Add entries to TODO_SUMMARY.md (with **[TODO]** and **[FIXME]** prefixes) linking to the Issues and commits.

## 🧪 Dry Run Mode

To test the action without making any changes:

```yaml
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
  dry_run: true
  commit: false
```

This configuration will output the actions that would have been taken without creating or updating any Issues or files.

## 🤝 Contributing

Contributions are welcome! Please open an Issue or submit a Pull Request for any enhancements or bug fixes.

For more details and updates, visit the [TODO-Sync GitHub repository](https://github.com/Solo-Web-Works/TODO-Sync).

## 📄 License

This project is licensed under the Unlicense, making it public domain software.
