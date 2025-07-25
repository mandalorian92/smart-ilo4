// Version information for the Smart-ilo4 application
import packageJson from '../../package.json';

export interface VersionInfo {
  version: string;
  buildDate: string;
  gitCommit?: string;
}

// Get version from package.json as primary source
export const getVersionInfo = (): VersionInfo => {
  return {
    version: packageJson.version,
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString().split('T')[0],
    gitCommit: process.env.REACT_APP_GIT_COMMIT
  };
};

// Format version for display
export const formatVersion = (version: string): string => {
  return `Version ${version}`;
};

// Get full version string with build info
export const getFullVersionString = (): string => {
  const info = getVersionInfo();
  let versionString = formatVersion(info.version);
  
  if (info.buildDate) {
    versionString += ` (${info.buildDate})`;
  }
  
  return versionString;
};

export default {
  getVersionInfo,
  formatVersion,
  getFullVersionString
};
