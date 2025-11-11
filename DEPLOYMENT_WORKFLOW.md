# Deployment Workflow Guide

## 🎯 Recommended Workflow: Test First, Then Deploy

**Best Practice**: Test locally first → Fix issues → Deploy to cPanel

```
Development → Local Testing → Fix Issues → Deploy to cPanel → Production Testing
```

## 📋 Step-by-Step Workflow

### Option 1: Test Locally First (Recommended) ✅

#### Step 1: Test Locally
```bash
# 1. Set up local Laravel environment
cd /path/to/local/laravel/project

# 2. Copy files from vosm directory
cp -r /Users/narnolia/code/voms-pwa/vosm/app/Http/Controllers/* app/Http/Controllers/
cp -r /Users/narnolia/code/voms-pwa/vosm/app/Models/* app/Models/
cp -r /Users/narnolia/code/voms-pwa/vosm/app/Services app/
cp -r /Users/narnolia/code/voms-pwa/vosm/database/migrations/* database/migrations/

# 3. Update routes/api.php (merge with existing)

# 4. Run migrations
php artisan migrate

# 5. Start local server
php artisan serve
```

#### Step 2: Test All Features
- ✅ Inspection Dashboard - Should show real data
- ✅ Gate Pass Creation - Should create with QR code
- ✅ Gate Pass Approval - Buttons should work
- ✅ Expense Approval - Buttons should work
- ✅ QR Code Generation - Should return secure token

#### Step 3: Fix Any Issues
- Fix bugs found during testing
- Verify all endpoints work
- Check database migrations run successfully

#### Step 4: Deploy to cPanel
```bash
# 1. Upload files to cPanel via FTP/SFTP or File Manager
# 2. SSH into cPanel server (if available)
# 3. Run migrations on production database
php artisan migrate --force

# 4. Clear caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### Step 5: Test on Production
- Test all features on live site
- Verify database changes applied
- Check logs for errors

---

### Option 2: Deploy to cPanel First (If No Local Setup)

**⚠️ Warning**: Only do this if you don't have a local Laravel setup. Testing on production can cause issues.

#### Step 1: Backup Production Database
```bash
# Create backup before making changes
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
```

#### Step 2: Upload Files to cPanel
- Upload new controllers, models, services
- Upload new migrations
- Update routes/api.php

#### Step 3: Run Migrations (Carefully!)
```bash
# SSH into cPanel or use terminal
cd /path/to/laravel/project
php artisan migrate --force
```

#### Step 4: Test on Production
- Test all features immediately
- Monitor for errors
- Check Laravel logs: `storage/logs/laravel.log`

#### Step 5: Rollback if Issues
```bash
# If something breaks, rollback migrations
php artisan migrate:rollback --step=5

# Or restore from backup
mysql -u username -p database_name < backup_YYYYMMDD.sql
```

---

## 🚨 Important Considerations

### Before Deploying to cPanel

1. **Backup Everything**
   - Database backup
   - File backup (via cPanel File Manager)
   - Current `.env` file

2. **Check Prerequisites**
   - ✅ Base tables exist (`visitor_gate_passes`, `vehicle_entry_passes`, `expenses`, etc.)
   - ✅ PHP version is 8.1+ (check in cPanel)
   - ✅ Composer is available (check via SSH)
   - ✅ Database credentials are correct

3. **Verify File Permissions**
   ```bash
   chmod -R 755 storage bootstrap/cache
   chown -R username:username storage bootstrap/cache
   ```

4. **Test Database Connection**
   ```bash
   php artisan tinker
   DB::connection()->getPdo();
   ```

### During Deployment

1. **Deploy During Low Traffic** (if possible)
2. **Deploy Migrations First**
   ```bash
   php artisan migrate --force
   ```
3. **Then Deploy Code**
4. **Clear Caches**
   ```bash
   php artisan config:cache
   php artisan route:cache
   ```

### After Deployment

1. **Test Immediately**
   - Check all endpoints
   - Verify database changes
   - Test approval workflows

2. **Monitor Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Check for Errors**
   - Check cPanel error logs
   - Check Laravel logs
   - Check browser console (for frontend)

---

## 📦 Files to Deploy to cPanel

### New Files to Upload:
```
app/Http/Controllers/Api/
  ├── GatePassApprovalController.php
  ├── ExpenseApprovalController.php
  ├── VisitorGatePassController.php
  ├── VehicleEntryPassController.php
  └── VehicleExitPassController.php

app/Models/
  ├── ApprovalRequest.php
  └── ApprovalLevel.php

app/Services/
  └── QRCodeService.php

database/migrations/
  ├── 2025_01_27_000001_create_approval_requests_table.php
  ├── 2025_01_27_000002_create_approval_levels_table.php
  ├── 2025_01_27_000003_add_approval_fields_to_gate_passes.php
  ├── 2025_01_27_000004_add_approval_fields_to_expenses.php
  └── 2025_01_27_000005_add_qr_code_fields_to_gate_passes.php
```

### Files to Update:
```
routes/api.php (merge new routes)
app/Http/Controllers/InspectionDashboardController.php (already fixed)
```

---

## 🔄 Deployment Checklist

### Pre-Deployment
- [ ] All code tested locally (if possible)
- [ ] Database backup created
- [ ] File backup created
- [ ] `.env` file backed up
- [ ] Prerequisites checked (PHP version, Composer, etc.)

### Deployment
- [ ] Upload new files to cPanel
- [ ] Update routes/api.php
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Clear caches: `php artisan config:cache`
- [ ] Set file permissions

### Post-Deployment
- [ ] Test inspection dashboard
- [ ] Test gate pass creation
- [ ] Test gate pass approval
- [ ] Test expense approval
- [ ] Check logs for errors
- [ ] Verify QR codes work

---

## 🐛 Troubleshooting

### Migration Fails
```bash
# Check if tables exist
php artisan tinker
DB::select('SHOW TABLES');

# Check migration status
php artisan migrate:status

# Rollback if needed
php artisan migrate:rollback --step=5
```

### Routes Not Working
```bash
# Clear route cache
php artisan route:clear
php artisan route:cache

# List routes to verify
php artisan route:list | grep approval
```

### 500 Errors
```bash
# Check logs
tail -f storage/logs/laravel.log

# Check permissions
ls -la storage bootstrap/cache

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## 💡 Recommendation

**For your situation**: Since you're asking about cPanel, I recommend:

1. **If you have access to local Laravel setup**: Test locally first, then deploy
2. **If you don't have local setup**: 
   - Create a backup first
   - Deploy to cPanel
   - Test immediately
   - Have rollback plan ready

**Best Practice**: Always test locally first if possible. It's safer and faster to fix issues locally than on production.

