#!/bin/bash

###############################################################################
# DRG Recovery Tool — GitHub Initialization Script
# Activates Git repository, GitHub remote, and CI/CD pipeline
#
# Usage: bash scripts/init-github.sh
# Or: chmod +x scripts/init-github.sh && ./scripts/init-github.sh
###############################################################################

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DRG Recovery Tool — GitHub Repository Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Step 1: Check Git installation
echo "📋 Checking prerequisites..."
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git and try again."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) not found. Some features will require manual GitHub setup."
    GITHUB_CLI_AVAILABLE=false
else
    GITHUB_CLI_AVAILABLE=true
    echo "✅ GitHub CLI found"
fi

echo "✅ Git version: $(git --version)"
echo

# Step 2: Initialize Git repository
echo "🔧 Initializing Git repository..."
if [ -d .git ]; then
    echo "⚠️  Git repository already initialized"
else
    git init
    echo "✅ Git repository initialized"
fi

# Step 3: Configure Git (if not already configured)
echo
echo "🔧 Configuring Git user..."
if [ -z "$(git config user.name)" ]; then
    read -p "  Enter your name: " GIT_NAME
    git config user.name "$GIT_NAME"
fi

if [ -z "$(git config user.email)" ]; then
    read -p "  Enter your email: " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

echo "✅ Git user configured: $(git config user.name) <$(git config user.email)>"
echo

# Step 4: Stage all files
echo "🔧 Staging files for initial commit..."
git add -A
STAGED=$(git diff --cached --name-only | wc -l)
echo "✅ Staged $STAGED files"
echo

# Step 5: Create initial commit
echo "🔧 Creating initial commit..."
git commit -m "Initial commit: DRG Recovery Tool v1.0 MVP infrastructure

- Device I/O layer (Windows/macOS/Linux)
- Filesystem parsers (NTFS/FAT32/HFS+/Ext4)
- Quick Scan + Deep Scan engines
- File extraction and recovery
- Comprehensive test suite (120+ cases)
- GitHub Actions CI/CD pipeline

Co-Authored-By: Claude (Autonomous) <noreply@anthropic.com>"

COMMIT_HASH=$(git rev-parse --short HEAD)
echo "✅ Initial commit created: $COMMIT_HASH"
echo

# Step 6: GitHub remote setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 GitHub Remote Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

if [ "$GITHUB_CLI_AVAILABLE" = true ]; then
    echo "Using GitHub CLI to create repository..."

    # Check if user is authenticated
    if ! gh auth status > /dev/null 2>&1; then
        echo "❌ Not authenticated with GitHub. Please run: gh auth login"
        GITHUB_CLI_AVAILABLE=false
    else
        echo "✅ GitHub authentication verified"

        # Create repository
        read -p "Enter GitHub repository name (default: drg-recovery-tool): " REPO_NAME
        REPO_NAME=${REPO_NAME:-drg-recovery-tool}

        read -p "Enter GitHub username/organization: " GITHUB_OWNER

        echo "Creating repository on GitHub..."

        # Check if repo already exists
        if gh repo view "$GITHUB_OWNER/$REPO_NAME" > /dev/null 2>&1; then
            echo "⚠️  Repository already exists"
        else
            gh repo create "$GITHUB_OWNER/$REPO_NAME" --public --source=. --remote=origin --push
            echo "✅ Repository created and pushed"
        fi

        GITHUB_URL="https://github.com/$GITHUB_OWNER/$REPO_NAME"
    fi
else
    echo "GitHub CLI not available. Manual setup required:"
    echo
    echo "  1. Create a new repository on GitHub.com"
    echo "  2. Copy the HTTPS URL (e.g., https://github.com/user/drg-recovery-tool.git)"
    echo "  3. Run the command below:"
    echo
    read -p "Enter GitHub HTTPS URL: " GITHUB_URL
fi

# Step 7: Add remote and push
if [ -n "$GITHUB_URL" ]; then
    echo
    echo "🔧 Adding GitHub remote..."

    # Remove existing remote if it exists
    if git remote get-url origin > /dev/null 2>&1; then
        git remote remove origin
    fi

    git remote add origin "$GITHUB_URL"
    echo "✅ Remote added: $(git remote get-url origin)"

    echo "🔧 Pushing to GitHub..."
    git branch -M main
    git push -u origin main
    echo "✅ Pushed to GitHub"
    echo
fi

# Step 8: CI/CD Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GitHub Setup Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

if [ -n "$GITHUB_URL" ]; then
    echo "📊 Repository: $GITHUB_URL"
    echo "📋 Branch: main"
    echo "📝 Commit: $COMMIT_HASH"
    echo
    echo "🔄 GitHub Actions CI/CD:"
    echo "   - Workflow file: .github/workflows/ci.yml"
    echo "   - Triggered on: push to main/develop, pull_request"
    echo "   - Status page: $GITHUB_URL/actions"
    echo
    echo "ℹ️  Next steps:"
    echo "   1. Check GitHub Actions status in the Actions tab"
    echo "   2. Verify tests pass across all platforms (Ubuntu/macOS/Windows)"
    echo "   3. Monitor for any workflow failures"
    echo
fi

echo "🎉 GitHub initialization complete!"
