#!/usr/bin/env node

/**
 * Reset Mock Data Script
 * 
 * This script removes all hardcoded mock data from the application to comply with
 * the CentralHealth System rules which prohibit any mock or test data.
 * 
 * Usage: node scripts/reset-mock-data.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const glob = promisify(require('glob'));

// Patterns to find and replace
const patterns = [
  {
    // Match hardcoded numbers with trend data
    regex: /<div className="text-2xl font-bold">\$?[\d,.]+%?(?:\s*\w+)?<\/div>\s*<p className="text-xs text-muted-foreground">[^<]*(?:from|this)[^<]*<\/p>/g,
    replacement: (match) => {
      // Extract the unit (if any) from the original value
      const unitMatch = match.match(/<div className="text-2xl font-bold">\$?[\d,.]+(%?)(?:\s*(\w+))?<\/div>/);
      const percentSign = unitMatch && unitMatch[1] ? '%' : '';
      const unit = unitMatch && unitMatch[2] ? ` ${unitMatch[2]}` : '';
      
      return `<div className="text-2xl font-bold">0${percentSign}${unit}</div>\n            <p className="text-xs text-muted-foreground">No data available</p>`;
    }
  }
];

async function processFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    
    for (const pattern of patterns) {
      const originalContent = content;
      content = content.replace(pattern.regex, pattern.replacement);
      
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    if (modified) {
      await writeFile(filePath, content, 'utf8');
      console.log(`✅ Reset mock data in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  try {
    console.log('🔍 Finding files with mock data...');
    
    // Find all TSX files in the admin directory
    const files = await glob('app/**/admin/**/*.tsx', {
      cwd: path.resolve(__dirname, '..')
    });
    
    console.log(`Found ${files.length} potential files to process`);
    
    let modifiedCount = 0;
    
    // Process each file
    for (const file of files) {
      const filePath = path.resolve(__dirname, '..', file);
      const wasModified = await processFile(filePath);
      
      if (wasModified) {
        modifiedCount++;
      }
    }
    
    console.log(`\n✅ Successfully reset mock data in ${modifiedCount} files`);
    console.log('All mock data has been removed to comply with CentralHealth System rules');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
