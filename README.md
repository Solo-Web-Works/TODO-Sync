# TODO-Sync

TODO-Sync is a GitHub Action that automatically scans your codebase for TODO comments, creates or updates corresponding GitHub Issues, and generates a markdown summary file. This tool helps maintainers keep track of pending tasks directly from the source code, ensuring that nothing slips through the cracks.
GitHub

## ✨ Features

- Automated Issue Creation: Detects TODO comments and creates GitHub Issues accordingly.
- Issue Updating: Updates existing Issues if corresponding TODO comments are modified.
- Markdown Summary: Generates a TODO_SUMMARY.md file listing all detected TODO comments with links to their Issues.
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
        uses: actions/checkout@v4

      - name: Sync TODOs
        uses: Solo-Web-Works/TODO-Sync@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          summary_file: TODO_SUMMARY.md
          dry_run: false
          commit: true
```

## ⚙️ Inputs

| Name           | Description                                                                            | Required | Default           |
| -------------- | -------------------------------------------------------------------------------------- | -------- | ----------------- |
| `github_token` | GitHub token with `repo` and `issues` scopes. Typically `${{ secrets.GITHUB_TOKEN }}`. | Yes      | N/A               |
| `summary_file` | Path to the markdown file where the TODO summary will be written.                      | No       | `TODO_SUMMARY.md` |
| `dry_run`      | If set to `true`, the action will simulate the process without making changes.         | No       | `false`           |
| `commit`       | If set to `true`, the action will commit the updated summary file to the repository.   | No       | `true`            |

## 📝 Output

After execution, the action will:

- Scan the codebase for TODO comments.
- Create or update GitHub Issues corresponding to each TODO.
- Generate or update the specified markdown summary file with a list of all TODO comments and links to their Issues.

## 🛠️ Example

Given the following code snippet:

```javascript
// TODO: Refactor this function to improve performance
function processData(data) {
  // ...
}
```

The action will:

- Create or update a GitHub Issue titled "Refactor this function to improve performance".
- Add an entry to TODO_SUMMARY.md linking to the Issue.
- YouTube+2GitHub+2DEV Community+2
- Stack Overflow+5Reddit+5Stack Overflow+5

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
