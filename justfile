set dotenv-load := true
set shell := ["bash", "-c"]


# list available just commands
_default:
    @just --list

[doc('Release a new version. Updates package.json version, runs npm run build, git tags, and pushes changes to git and npm.')]
[group('release')]
release version:
    #!/usr/bin/env bash
    set -euo pipefail

    VERSION="{{version}}"

    if [[ -z "${VERSION}" ]]; then
        echo "Error: release version argument is required" >&2
        exit 1
    fi

    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "Error: git working tree must be clean before releasing" >&2
        exit 1
    fi

    echo "Updating package.json and package-lock.json to version ${VERSION}"
    npm version "${VERSION}" --no-git-tag-version

    echo "Running build"
    npm run build

    echo "Committing release artifacts"
    git add package.json package-lock.json
    DIST_STATUS=$(git status --short dist 2>/dev/null || true)
    if [[ -n "${DIST_STATUS}" ]]; then
        git add dist
    fi
    git commit -S -m "release: v${VERSION}"

    echo "Tagging release"
    git tag "v${VERSION}"

    echo "Pushing changes to origin"
    git push origin HEAD
    git push origin "v${VERSION}"

    echo "Publishing ${VERSION} to npm"
    npm publish --access public
