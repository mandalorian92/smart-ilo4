#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const versionFilePath = path.join(__dirname, 'VERSION.json');
const backendPackagePath = path.join(__dirname, 'package.json');
const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');

// Load current version info
const loadVersionInfo = () => {
  if (fs.existsSync(versionFilePath)) {
    return JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  }
  return {
    version: '1.0.0',
    buildDate: new Date().toISOString().split('T')[0],
    changelog: []
  };
};

// Parse version string
const parseVersion = (version) => {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
};

// Format version
const formatVersion = (major, minor, patch) => {
  return `${major}.${minor}.${patch}`;
};

// Get git commit messages since last version
const getRecentCommits = () => {
  try {
    const commits = execSync('git log --oneline -20', { encoding: 'utf8' })
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [hash, ...message] = line.split(' ');
        return { hash, message: message.join(' ') };
      });
    return commits;
  } catch (error) {
    console.warn('Could not get git commits:', error.message);
    return [];
  }
};

// Determine version bump type based on commit messages
const determineVersionBump = (commits) => {
  let bumpType = 'patch'; // default
  
  for (const commit of commits) {
    const message = commit.message.toLowerCase();
    
    // Major version (breaking changes)
    if (message.includes('breaking') || message.includes('major:') || message.includes('!:')) {
      return 'major';
    }
    
    // Minor version (new features)
    if (message.startsWith('feat:') || message.startsWith('feature:') || 
        message.includes('add') || message.includes('implement') || 
        message.includes('enhance')) {
      bumpType = 'minor';
    }
    
    // Patch version (bug fixes, chores)
    // Already default, but could add specific checks
  }
  
  return bumpType;
};

// Update version
const updateVersion = (currentVersion, bumpType) => {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (bumpType) {
    case 'major':
      return formatVersion(major + 1, 0, 0);
    case 'minor':
      return formatVersion(major, minor + 1, 0);
    case 'patch':
      return formatVersion(major, minor, patch + 1);
    default:
      return currentVersion;
  }
};

// Extract changes from commits
const extractChanges = (commits) => {
  return commits.slice(0, 10).map(commit => {
    // Clean up commit message
    let message = commit.message
      .replace(/^(feat|fix|chore|docs|style|refactor|test):\s*/i, '')
      .replace(/^(feature|bugfix):\s*/i, '')
      .trim();
    
    // Capitalize first letter
    message = message.charAt(0).toUpperCase() + message.slice(1);
    
    return message;
  });
};

// Update package.json files
const updatePackageJson = (filePath, newVersion) => {
  if (fs.existsSync(filePath)) {
    const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated ${path.basename(filePath)} to version ${newVersion}`);
  }
};

// Main function
const main = () => {
  const args = process.argv.slice(2);
  const forceType = args[0]; // 'major', 'minor', 'patch', or undefined for auto
  
  console.log('🔍 Analyzing version requirements...');
  
  const versionInfo = loadVersionInfo();
  const currentVersion = versionInfo.version;
  const commits = getRecentCommits();
  
  console.log(`📋 Current version: ${currentVersion}`);
  console.log(`📝 Found ${commits.length} recent commits`);
  
  const bumpType = forceType || determineVersionBump(commits);
  const newVersion = updateVersion(currentVersion, bumpType);
  
  if (newVersion === currentVersion && !forceType) {
    console.log('✅ No version bump needed');
    return;
  }
  
  console.log(`🚀 Bumping version: ${currentVersion} → ${newVersion} (${bumpType})`);
  
  // Extract changes for changelog
  const changes = extractChanges(commits);
  
  // Update VERSION.json
  const newVersionInfo = {
    version: newVersion,
    buildDate: new Date().toISOString().split('T')[0],
    changelog: [
      {
        version: newVersion,
        date: new Date().toISOString().split('T')[0],
        type: bumpType,
        changes: changes
      },
      ...versionInfo.changelog
    ].slice(0, 10) // Keep only last 10 versions
  };
  
  fs.writeFileSync(versionFilePath, JSON.stringify(newVersionInfo, null, 2) + '\n');
  console.log(`✅ Updated VERSION.json`);
  
  // Update package.json files
  updatePackageJson(backendPackagePath, newVersion);
  updatePackageJson(frontendPackagePath, newVersion);
  
  console.log(`\n🎉 Version bump complete!`);
  console.log(`📦 New version: ${newVersion}`);
  console.log(`📅 Build date: ${newVersionInfo.buildDate}`);
  console.log(`\n📋 Changes included:`);
  changes.forEach(change => console.log(`  • ${change}`));
};

if (require.main === module) {
  main();
}

module.exports = { main, determineVersionBump, updateVersion };
