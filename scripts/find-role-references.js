#!/usr/bin/env node

/**
 * Script to find all hard-coded role references in the codebase
 * Helps identify what needs to be migrated to capability-based system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROLE_PATTERNS = [
  // Direct role comparisons
  /role\s*===?\s*['"](super_admin|admin|supervisor|guard|inspector|clerk|executive|yard_incharge)['"]/gi,
  /role\s*!==?\s*['"](super_admin|admin|supervisor|guard|inspector|clerk|executive|yard_incharge)['"]/gi,
  /user\?\.role\s*===?\s*['"](super_admin|admin|supervisor|guard|inspector|clerk|executive|yard_incharge)['"]/gi,
  /currentUser\?\.role\s*===?\s*['"](super_admin|admin|supervisor|guard|inspector|clerk|executive|yard_incharge)['"]/gi,
  
  // Role arrays
  /roles:\s*\[["'](super_admin|admin|supervisor|guard|inspector|clerk|executive|yard_incharge)["']/gi,
  
  // RequireRole usage
  /<RequireRole\s+roles=\{/gi,
  
  // Type definitions
  /type\s+Role\s*=\s*["'](super_admin|admin|supervisor|guard|inspector|clerk|executive|yard_incharge)["']/gi,
  
  // Role includes/checks
  /roles\.includes\(/gi,
  /roles\.some\(/gi,
  /roles\.every\(/gi,
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /dist/,
  /\.test\./,
  /\.spec\./,
  /audit\//,
  /docs\//,
  /\.md$/,
  /\.json$/,
  /\.log$/,
];

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!shouldExclude(filePath)) {
        findFiles(filePath, fileList);
      }
    } else if (stat.isFile()) {
      if (!shouldExclude(filePath) && /\.(ts|tsx|js|jsx)$/.test(file)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

function findRoleReferences(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const matches = [];
  
  ROLE_PATTERNS.forEach((pattern, index) => {
    const matchesInFile = [...content.matchAll(pattern)];
    matchesInFile.forEach(match => {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1]?.trim() || '';
      
      matches.push({
        pattern: index,
        line: lineNumber,
        match: match[0],
        context: line.substring(0, 100),
      });
    });
  });
  
  return matches;
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`\n🔍 Scanning ${files.length} files for hard-coded role references...\n`);
  
  const results = [];
  
  files.forEach(file => {
    const matches = findRoleReferences(file);
    if (matches.length > 0) {
      results.push({
        file: path.relative(process.cwd(), file),
        matches,
      });
    }
  });
  
  // Group by file
  console.log('📊 Results:\n');
  console.log('='.repeat(80));
  
  results.forEach(({ file, matches }) => {
    console.log(`\n📄 ${file}`);
    console.log(`   Found ${matches.length} reference(s)\n`);
    
    matches.forEach(({ line, match, context }) => {
      console.log(`   Line ${line}: ${match}`);
      console.log(`   Context: ${context}...`);
      console.log('');
    });
  });
  
  // Summary
  const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);
  console.log('='.repeat(80));
  console.log(`\n📈 Summary:`);
  console.log(`   Files with role references: ${results.length}`);
  console.log(`   Total references found: ${totalMatches}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review each file in the migration plan`);
  console.log(`   2. Replace role checks with capability checks`);
  console.log(`   3. Test thoroughly after each change\n`);
  
  // Write results to file
  const outputFile = path.join(__dirname, '..', 'role-references-report.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`📝 Detailed report saved to: ${outputFile}\n`);
}

if (require.main === module) {
  main();
}

module.exports = { findRoleReferences, findFiles };

