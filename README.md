# TODO Sync Action

This GitHub Action scans your repository for TODO comments, opens/updates GitHub issues for them, and writes a Markdown summary.

## Usage

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
