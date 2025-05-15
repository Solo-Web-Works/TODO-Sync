# TODO Sync Action

This GitHub Action scans your repository for TODO comments, opens/updates GitHub issues for them, and writes a Markdown summary.

## Usage

```yaml
- name: Sync TODOs
  uses: your-org/todo-sync-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    summary_file: docs/todos.md
    dry_run: false
    commit: true
```
