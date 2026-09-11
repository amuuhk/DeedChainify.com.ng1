# DeedChainify Deployment Guide

This guide covers deploying the DeedChainify platform to production.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Create Supabase project
- [ ] Apply all database migrations in order
- [ ] Configure Supabase Auth settings
- [ ] Set up Row Level Security (RLS) policies
- [ ] Generate and save environment variables

### 2. Code Verification
- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm run lint` - no critical errors
- [ ] Run `npm run build` - successful build
- [ ] Test all critical user flows locally

### 3. Third-Party Services
- [ ] Configure Youverify for KYC verification
- [ ] Set up Termii for SMS notifications
- [ ] Configure Paystack for payment processing
- [ ] Update API keys in environment variables

## Environment Variables

Create `.env` file with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-deployed-domain.com

# Optional: Third-party API Keys
NEXT_PUBLIC_YOUVERIFY_API_KEY=your-youverify-key
NEXT_PUBLIC_TERMII_API_KEY=your-termii-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your-paystack-key
PAYSTACK_SECRET_KEY=your-paystack-secret-key
```

## Deployment Options

### Option 1: Netlify (Recommended)

#### Step 1: Prepare Repository
```bash
# Ensure .gitignore includes:
node_modules/
.next/
.env
.env.local
```

#### Step 2: Connect to Netlify
1. Go to Netlify dashboard
2. "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Select the `project` folder as root directory

#### Step 3: Configure Build Settings
```
Build command: npm run build
Publish directory: .next
Node version: 18
```

#### Step 4: Environment Variables
Add the following in Netlify → Site Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

#### Step 5: Deploy
Netlify will automatically build and deploy on push to main branch.

### Option 2: Vercel

#### Step 1: Import Project
1. Go to Vercel dashboard
2. "Add New Project"
3. Import your Git repository
4. Select the `project` folder

#### Step 2: Configure Framework Preset
- Framework: Next.js
- Root Directory: `project`

#### Step 3: Environment Variables
Add the required environment variables in Vercel project settings.

#### Step 4: Deploy
Vercel will automatically build and deploy.

### Option 3: Manual Deployment

#### Step 1: Build Locally
```bash
cd project
npm run build
```

#### Step 2: Deploy to Server
Upload the `.next` folder to your server and configure your web server (Nginx, Apache, etc.) to serve it.

## Supabase Setup

### 1. Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region closest to your users
4. Generate and save database password

### 2. Apply Migrations
In Supabase SQL Editor, run these migrations in order:

```sql
-- Core schema
-- 20260823181335_create_deedchainify_schema.sql

-- Additional tables
-- 20260823183008_add_settings_table.sql
-- 20260824114958_create_transfers_table.sql
-- 20260824155012_create_private_ledger_table.sql
-- 20260824155027_add_geotier_custodium_columns_to_transfers.sql
-- 20260824161734_create_scan_logs_table.sql
-- 20260825143346_create_property_owners_table.sql
-- 20260826164733_add_admin_read_all_policies.sql

-- Collateral system
-- 20260830120000_create_collateral_system.sql
```

### 3. Configure Authentication
- Go to Authentication → URL Configuration
- Add your deployed site URL to Site URL
- Add redirect URLs for OAuth if needed

### 4. Enable RLS
Row Level Security is already configured in migrations. Verify in Supabase dashboard:
- Authentication → Policies
- Ensure all tables have RLS enabled

## Post-Deployment Tasks

### 1. Test Critical Flows
- [ ] User registration and login
- [ ] Property onboarding (single and co-ownership)
- [ ] QR code verification
- [ ] Chief approval workflow
- [ ] Bank collateral loan creation
- [ ] Payment processing

### 2. Monitor Performance
- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor Supabase performance
- Check API response times

### 3. Security Review
- [ ] Verify environment variables are not exposed
- [ ] Check CORS settings in Supabase
- [ ] Review RLS policies
- [ ] Test authentication flows

### 4. Backup Strategy
- Enable Supabase automated backups
- Set up database export scripts
- Document recovery procedures

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
- Verify environment variables
- Check Supabase project status
- Test connection with Supabase dashboard

### Authentication Issues
- Check redirect URLs in Supabase
- Verify cookie settings
- Test with incognito browser

### Performance Issues
- Enable Supabase query performance insights
- Add database indexes if needed
- Optimize large queries

## Monitoring

### Recommended Tools
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Supabase Dashboard**: Database monitoring
- **Netlify Analytics**: Site performance (if using Netlify)

### Key Metrics to Monitor
- Page load time
- API response time
- Database query performance
- Error rates
- User engagement metrics

## Scaling Considerations

### Database
- Monitor connection pool size
- Consider read replicas for high traffic
- Archive old data periodically

### Application
- Enable CDN for static assets
- Consider server-side rendering for critical pages
- Implement caching strategies

### Cost Optimization
- Monitor Supabase usage and billing
- Optimize database queries
- Implement efficient pagination

## Rollback Procedure

### If Deployment Fails
1. Rollback to previous commit
2. Restore database from backup if needed
3. Communicate with users about downtime

### Database Issues
1. Use Supabase point-in-time recovery
2. Restore from recent backup
3. Re-run migrations if needed

## Maintenance

### Regular Tasks
- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Review and optimize database
- Annually: Security audit

### Updates
- Test updates in staging environment first
- Create backups before major updates
- Schedule maintenance windows

## Support Contacts

- **Technical Issues**: Development team
- **Database Issues**: Supabase support
- **Deployment Issues**: Hosting provider support

---

**Note**: This deployment guide assumes you have access to the necessary services and permissions. Adjust based on your specific hosting environment.