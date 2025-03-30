# Exporting from Replit to GitHub

Before deploying to Railway.app, you'll need to export your code from Replit to a GitHub repository. This guide walks you through the process.

## Method 1: Using Git in the Replit Shell

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   ```

2. **Add All Files to Git**:
   ```bash
   git add .
   ```

3. **Commit Your Changes**:
   ```bash
   git commit -m "Initial commit for Railway deployment"
   ```

4. **Add Your GitHub Repository as Remote**:
   ```bash
   git remote add origin https://github.com/YourUsername/YourRepositoryName.git
   ```

5. **Push Your Code to GitHub**:
   ```bash
   git push -u origin main
   ```
   Note: If your branch is called "master" instead of "main", use `git push -u origin master`.

## Method 2: Using Replit's GitHub Integration

1. **Open your Replit project**

2. **Click on the "Version Control" tab** in the left sidebar (the icon looks like a branch)

3. **Connect to GitHub**:
   - If you haven't connected your GitHub account yet, follow the prompts to connect
   - Once connected, click "Create a Git repository"
   - Choose whether to make it public or private
   - Click "Create repository"

4. **Push Your Code to GitHub**:
   - After the repository is created, you can push your code by clicking "Commit & push"
   - Enter a commit message
   - Click the "Commit & push" button to upload your code to GitHub

## Method 3: Exporting as ZIP and Manually Uploading

If you're having trouble with Git, you can also:

1. **Download your Replit project as a ZIP file**:
   - Click the three dots (...) next to your project name
   - Select "Download as ZIP"

2. **Create a new GitHub repository** on github.com

3. **Upload the files**:
   - Extract the ZIP on your computer
   - On your GitHub repository page, click "Add file" > "Upload files"
   - Drag and drop the extracted files or use the file selector
   - Commit the changes

## Next Steps

Once your code is on GitHub, follow the instructions in the main README.md to deploy to Railway.app by connecting Railway to your GitHub repository.