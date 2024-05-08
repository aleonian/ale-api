require("dotenv").config();
const { execSync } = require('child_process');
const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
const date = new Date(Date.now());

// Get the various components of the date
const year = date.getFullYear();
const month = ('0' + (date.getMonth() + 1)).slice(-2); // Adding 1 because getMonth() returns zero-based index
const day = ('0' + date.getDate()).slice(-2);
const hours = ('0' + date.getHours()).slice(-2);
const minutes = ('0' + date.getMinutes()).slice(-2);
const seconds = ('0' + date.getSeconds()).slice(-2);

// Construct the readable date format
const readableDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
const filePath = path.resolve(process.env.TARGET_FILE); // Replace with the path to the file you want to modify
const baseBranch = process.env.BASE_BRANCH;
const commitMessage = 'Automated file update->' + readableDate; // Commit message for the changes
const repoPath = path.resolve(process.env.REPO_PATH); // Path to the repository

async function modifyFile(filePath, newContent) {
    // Read the existing file content
    let existingContent = '';
    try {
        existingContent = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        return;
    }

    // Modify the file content
    const modifiedContent = existingContent + '\n' + newContent;

    // Write the modified content back to the file
    try {
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
    } catch (error) {
        console.error(`Error writing to file: ${error}`);
        return;
    }

    console.log(`File ${filePath} modified successfully.`);
}

async function commitChanges(repoPath, filePath, commitMessage) {
    // Change directory to the repository path
    process.chdir(repoPath);

    // Stage the changes
    execSync(`git add ${filePath}`);

    // Commit the changes
    execSync(`git commit -m "${commitMessage}"`);

    console.log('Changes committed successfully.');
}

async function pushChanges(repoPath, branchName) {
    // Change directory to the repository path
    process.chdir(repoPath);

    // Push the changes to the branch
    execSync(`git push origin ${branchName} -f`);

    console.log('Changes pushed successfully.');
}

// Usage example
async function main() {
    try {
        // Modify the file in the repository
        console.log("Modify the file in the repository");
        await modifyFile(filePath, 'New content: ' + readableDate);

        // Create a new branch
        // console.log("Create a new branch");
        // await remoteCreateBranch(repoOwner, repoName, baseBranch, newBranch);
        // await createBranch(repoPath, newBranch);

        // Commit the changes to the new branch
        console.log("Commit the changes to the new branch");
        await commitChanges(repoPath, filePath, commitMessage);
        // await remoteCommitChanges(repoOwner, repoName, newBranch, filePath, commitMessage);

        // Push the changes to the repository
        console.log("Push the changes to the new branch");
        await pushChanges(repoPath, baseBranch);

        // Create a pull request
        // console.log("Create a pull request");
        // const pullRequestId = await createPullRequest(repoOwner, repoName, baseBranch, newBranch, 'Feature XYZ', 'This pull request implements feature XYZ.');

        // Approve the pull request
        // console.log("Approve the pull request");
        // await approvePullRequest(repoOwner, repoName, pullRequestId);

        // Merge the pull request
        // console.log("Merge the pull request");
        // await mergePullRequest(repoOwner, repoName, pullRequestId);

        console.log('Workflow completed successfully.');
    } catch (error) {
        console.error('Error executing workflow:', error);
    }
}

main();
