// require("dotenv").config();
import dotenv from 'dotenv';
dotenv.config();// const { execSync } = require('child_process');
import { execSync } from "child_process";
// const XLSX = require('xlsx');
import XLSX from 'xlsx';
// const chalk = require('chalk');
import chalk from "chalk";
// const fs = require("fs");
import { promises as fsPromises } from 'fs';// const path = require("path");
import path from "path";
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
const targetFile = path.resolve(process.env.TARGET_FILE); // Replace with the path to the file you want to modify
const baseBranch = process.env.BASE_BRANCH;
const commitMessage = 'Automated file update->' + readableDate; // Commit message for the changes
const repoPath = path.resolve(process.env.REPO_PATH); // Path to the repository

console.log("repoPath->", repoPath);

async function modifyFile(targetFile, newContentFile) {

    console.log("targetFile->", targetFile);
    console.log("newContentFile->", newContentFile);
    // Read the existing file content
    let newContent;
    try {
        newContent = await fsPromises.readFile(newContentFile, 'utf8');
    } catch (error) {
        console.error(`Error reading file: ${error}`);
        return;
    }

    // Write the modified content back to the file
    try {
        await fsPromises.writeFile(targetFile, newContent, 'utf8');
    } catch (error) {
        console.error(`Error writing to file: ${error}`);
        return;
    }
    console.log(`File ${targetFile} modified successfully.`);
}

async function commitChanges(repoPath, filePath, commitMessage) {
    // Change directory to the repository path
    process.chdir(repoPath);

    console.log("filePath->", filePath);

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
function exitProgram() {
    process.exit();
}

// Usage example
async function main() {
    try {
        if (args.length < 1) {
            console.log(chalk.red('Bro, you need to provide a filename. Aborting.'));
            exitProgram();
        }
        const excelFile = args[0];

        const fileExtension = path.extname(excelFile);

        if (fileExtension.toLowerCase() !== '.xlsx') {
            console.log(chalk.red('Bro, the file should have a xlsx extension. Aborting.'));
            exitProgram();
        }
        console.log(chalk.green('We gonna process the Excel file.'));

        await processExcelFile(excelFile);

        // Modify the file in the repository
        console.log("Modify the file in the repository");
        const processedFile = path.resolve("./output.json");
        await modifyFile(targetFile, processedFile);

        // Commit the changes to the new branch
        console.log("Commit the changes to the new branch");
        await commitChanges(repoPath, targetFile, commitMessage);

        // Push the changes to the repository
        console.log("Push the changes to the new branch");
        await pushChanges(repoPath, baseBranch);

        console.log('Workflow completed successfully.');
        await fsPromises.unlink(path.resolve(filprocessedFileePath));

    } catch (error) {
        console.error('Error executing workflow:', error);
    }
}

async function processExcelFile(excelFilePath) {
    try {
        // Read the Excel file
        const data = await fsPromises.readFile(path.resolve(excelFilePath));

        // Convert the Excel data to JSON
        const workbook = XLSX.read(data, { type: 'buffer' });

        let allSheetData = {};

        workbook.SheetNames.forEach(function (sheetName) {
            const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: null });

            // Convert numeric values to floating-point numbers
            const decimalData = jsonData.map(row => {
                for (const key in row) {
                    if (!isNaN(row[key])) {
                        row[key] = parseFloat(row[key]);
                    }
                }
                return row;
            });

            allSheetData[sheetName] = decimalData;
        });

        // Convert JSON data to a string
        const jsonString = JSON.stringify(allSheetData, null, 2);

        // Output the JSON string to a file
        await fsPromises.writeFile('output.json', jsonString, 'utf8');
    } catch (error) {
        console.error('Error processing the Excel file:', error);
    }
}

main();
