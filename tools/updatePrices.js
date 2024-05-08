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

    // Read the existing file content
    let newContent;
    try {
        newContent = await fsPromises.readFile(newContentFile, 'utf8');
    } catch (error) {
        errorLog(`modifyFile(): Error reading file: ${error}`);
        return false;
    }

    // Write the modified content back to the file
    try {
        await fsPromises.writeFile(targetFile, newContent, 'utf8');
    } catch (error) {
        errorLog(`modifyFile(): Error writing to file: ${error}`);
        return false;
    }
    successLog(`File ${targetFile} modified successfully.`);
    return true;
}

async function commitChanges(repoPath, filePath, commitMessage) {
    // Change directory to the repository path
    process.chdir(repoPath);
    let allGood = true;

    // Stage the changes
    try {
        execSync(`git add ${filePath}`);
    }
    catch (error) {
        allGood = false;
        errorLog('git add command failed with error:', error);
    }

    // Commit the changes
    try {
        execSync(`git commit -m "${commitMessage}"`);
    }
    catch (error) {
        allGood = false;
        errorLog('git commit -m command failed with error:' + error);
        errorLog("Were there any changes to commit?")
    }

    if (allGood)
        console.log(chalk.yellow("Changes committed successfully."));
    else {
        console.log(chalk.red("Changes NOT committed :("));
    }
    return allGood;
}

async function pushChanges(repoPath, branchName) {
    // Change directory to the repository path
    let allGood = true;
    try {
        process.chdir(repoPath);
        // Push the changes to the branch
        execSync(`git push origin ${branchName} -f`);
        successLog('Changes pushed successfully.');
    }
    catch (error) {
        errorLog("pushChanges() failed: " + error);
        allGood = false;
    }
    return allGood;
}

function exitProgram() {
    process.exit();
}

function errorLog(message) {
    console.log(chalk.red(message));
}

function successLog(message) {
    console.log(chalk.green(message));
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
        successLog('We gonna process the Excel file.');
        const excelProcessResult = await processExcelFile(excelFile);
        if (!excelProcessResult) {
            errorLog("processExcelFile() failed :(");
            exitProgram();
        }
        // Modify the file in the repository
        console.log(chalk.yellow("Gonna modify the file in the repository"));
        const processedFile = path.resolve("./output.json");
        const modifyResult = await modifyFile(targetFile, processedFile);
        if (!modifyResult) {
            exitProgram();
        }
        // Commit the changes to the new branch
        console.log(chalk.blue("Commit the changes to the new branch"));
        let commitResult = await commitChanges(repoPath, targetFile, commitMessage);
        if (!commitResult) {
            exitProgram();
        }
        // Push the changes to the repository
        console.log(chalk.cyan("Push the changes to the new branch"));
        const pushResult = await pushChanges(repoPath, baseBranch);
        if (!pushResult) {
            exitProgram();
        }
        successLog("Workflow completed successfully.")
        await fsPromises.unlink(path.resolve(processedFile));

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
        return true;
    } catch (error) {
        console.error('Error processing the Excel file:', error);
        return false;
    }
}

main();
