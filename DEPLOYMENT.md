# 🚀 Deployment Guide

This guide will help you deploy the AI-Adaptive Snake Game to GitHub and make it playable online using GitHub Pages.

## 📋 Prerequisites

- GitHub account
- Git installed on your computer
- Your game files ready (which you already have!)

## 🔧 Step-by-Step Deployment

### 1. Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `ai-adaptive-snake-game` (or your preferred name)
   - **Description**: "AI-enhanced Snake game that learns from player behavior"
   - **Visibility**: Public (required for free GitHub Pages)
   - **Initialize**: Leave unchecked (we already have files)
5. Click "Create repository"

### 2. Connect Your Local Repository to GitHub

Copy the commands from GitHub's "push an existing repository" section, or use these (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

### 4. Wait for Deployment

- GitHub will automatically deploy your game
- It may take a few minutes for the first deployment
- You'll see a green checkmark when it's ready
- Your game will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## 🎮 Your Game is Live!

Once deployed, your AI-Adaptive Snake Game will be accessible to anyone with the URL. The game includes:

- ✅ Full AI learning capabilities
- ✅ Responsive design for different screen sizes
- ✅ Data persistence using localStorage
- ✅ Cross-browser compatibility
- ✅ No server required - runs entirely in the browser

## 🔄 Updating Your Game

To update your deployed game:

1. Make changes to your local files
2. Commit the changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   git push
   ```
3. GitHub Pages will automatically redeploy your updated game

## 🛠️ Automated Testing

Your repository includes GitHub Actions workflows that will:

- ✅ Run all tests automatically on every push
- ✅ Deploy to GitHub Pages when you push to main branch
- ✅ Ensure code quality with linting

## 📊 Monitoring

You can monitor your deployment:

- **Actions tab**: See build and deployment status
- **Settings → Pages**: Check deployment status and URL
- **Insights → Traffic**: See visitor statistics (after some time)

## 🎯 Custom Domain (Optional)

If you have a custom domain:

1. Go to Settings → Pages
2. Add your custom domain in the "Custom domain" field
3. Create a CNAME file in your repository root with your domain
4. Configure your domain's DNS to point to GitHub Pages

## 🐛 Troubleshooting

**Game not loading?**
- Check the browser console for errors
- Ensure all file paths are correct
- Verify GitHub Pages is enabled and deployed

**Tests failing?**
- Check the Actions tab for detailed error messages
- Ensure all dependencies are properly listed in package.json

**Need help?**
- Check GitHub's [Pages documentation](https://docs.github.com/en/pages)
- Review the repository's Issues tab for common problems

## 🎉 Share Your Game!

Once deployed, share your AI-Adaptive Snake Game:
- Social media
- Gaming communities
- Developer forums
- Friends and family

Your game URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

**Happy Gaming! 🐍🎮**