# 🚨 SECURITY NOTICE

## Critical Security Fix Applied

**Date:** 2025-08-04  
**Issue:** Hardcoded credentials found in repository  
**Status:** RESOLVED  

### What Was Found:
- Admin password hash in `data/passwords.json`
- iLO credentials in plaintext in `config/ilo-config.json`
- User configuration in `data/users.json`

### Actions Taken:
1. ✅ Removed all credential files from repository
2. ✅ Added credential files to `.gitignore`
3. ✅ Removed files from git history
4. ✅ Created `.template` files for reference

### For Production Deployment:

**BEFORE** running the application, you must:

1. **Create your iLO configuration:**
   ```bash
   cp config/ilo-config.json.template config/ilo-config.json
   # Edit with your actual iLO credentials
   ```

2. **The application will prompt for initial setup** on first run where you can:
   - Set admin username and password
   - Configure iLO connection
   - This will create the credential files automatically

3. **Ensure proper file permissions:**
   ```bash
   chmod 600 config/ilo-config.json
   chmod 600 data/passwords.json
   chmod 600 data/users.json
   ```

### What to Do NOW:

1. **Change your iLO password immediately** - the credentials `fanuser:6BDseRW3cvEW0Jv` are now public
2. **Change your admin password** - anyone can decode the bcrypt hash
3. **Check your network logs** for unauthorized access
4. **Update all production instances** with new credentials

### Files Now Ignored:
- `config/ilo-config.json`
- `data/passwords.json` 
- `data/users.json`

**These files will NEVER be committed to git again.**
