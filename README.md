# DeedChainify - Nigerian Land Verification Platform

A comprehensive property verification system that digitizes land ownership in Nigeria using DCID (Digital Chain ID), QR codes, and community verification.

## 🚀 Features

### Core Functionality
- **Digital Identity System**: Lifetime DCID for every user (like BVN for property)
- **Property Verification**: QR code scanning for instant land verification
- **Co-Ownership**: Support for 1-50 property owners with fractional shares
- **Community Verification**: Neighbor confirmation and chief approval via SMS
- **Bank Collateral System**: Complete loan portfolio management for banks
- **Multi-Role System**: User, Landlord, Chief, Barrister, Developer, Bank, State roles

### Status System
- **VERIFIED**: Government-approved properties
- **WAITING**: Chief approval pending
- **DISPUTED**: Contested titles
- **COLLATERAL**: Properties pledged to banks

### Revenue Model
- Public QR scans: ₦5,000 after first free scan
- Private onboarding: ₦10K-₦50K based on geo-tier (Urban/City/Rural)
- Bank API subscriptions: Monthly fees

## 🛠️ Tech Stack

- **Frontend**: Next.js 13.5, React 18.2, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Integrations**: Paystack (payments), Termii (SMS), Youverify (KYC)
- **Other**: React Hook Form, Zod, date-fns, html5-qrcode

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account with project setup
- Environment variables configured

## 🔧 Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd DEEDCHAINIFY/project
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

4. **Run database migrations**
Apply the SQL migrations in order from your Supabase dashboard:
- `20260823181335_create_deedchainify_schema.sql`
- `20260823183008_add_settings_table.sql`
- `20260824114958_create_transfers_table.sql`
- `20260824155012_create_private_ledger_table.sql`
- `20260824155027_add_geotier_custodium_columns_to_transfers.sql`
- `20260824161734_create_scan_logs_table.sql`
- `20260825143346_create_property_owners_table.sql`
- `20260826164733_add_admin_read_all_policies.sql`
- `20260830120000_create_collateral_system.sql`

## 🚀 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
```

The development server will run on `http://localhost:3000`

## 🌐 Deployment

### Netlify Deployment (Recommended)

1. **Connect your repository to Netlify**
2. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

3. **Set environment variables in Netlify:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`

4. **Deploy** - Netlify will automatically build and deploy

### Vercel Deployment

1. **Import project to Vercel**
2. **Configure environment variables**
3. **Deploy** - Vercel handles the build automatically

### Manual Deployment

```bash
# Build the project
npm run build

# The .next folder contains the optimized production build
# Upload this to your hosting provider
```

## 📁 Project Structure

```
project/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Role-specific dashboards
│   ├── owner/               # Property owner features
│   ├── verify/              # Property verification
│   └── login/               # Authentication
├── components/              # Reusable UI components
│   ├── ui/                  # shadcn/ui components
│   └── *.tsx                # Custom components
├── lib/                     # Utilities and contexts
│   ├── supabase/           # Supabase client and types
│   ├── auth-context.tsx    # Authentication context
│   └── dcid.ts             # DCID generation logic
├── supabase/               # Database migrations and edge functions
│   ├── migrations/          # SQL schema files
│   └── functions/          # Serverless functions
└── public/                  # Static assets
```

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- Public read access for property verification
- Owner-scoped write operations
- KYC verification through Youverify
- SMS OTP for chief approvals via Termii
- Secure environment variable handling

## 🏦 Bank Portal Features

### Collateral Management
- **Loan Portfolio**: Track all property-backed loans
- **Risk Alerts**: Payment due, market value drops, insurance expiry
- **Insurance Tracking**: Policy management and coverage monitoring
- **Valuation History**: Property valuations over time
- **LTV Monitoring**: Loan-to-value ratio tracking

### Loan Creation Workflow
1. Search verified properties
2. Configure loan terms with automatic payment calculations
3. Add optional insurance coverage
4. Review and create collateral loan
5. Automatic property status update to "COLLATERAL"

## 📱 User Roles

- **User**: Property buyer, verify properties and owners
- **Landlord**: Property seller, onboard and manage land
- **Chief**: Community leader, approve land transfers via SMS
- **Barrister**: Lawyer, verify documents and generate deeds
- **Developer**: Real estate developer, manage projects
- **Bank**: Financial institution, manage collateral loans
- **State**: Government oversight
- **Admin**: Full platform control (disabled in current version)

## 🎨 Customization

### Branding
- Update `app/layout.tsx` metadata for site title and description
- Modify `lib/logo-context.tsx` for logo customization
- Update colors in `tailwind.config.ts`

### Geo-Tier Pricing
- Modify `lib/geotier.ts` for location-based pricing
- Update `lib/dcid.ts` for fee calculations

## 🐛 Troubleshooting

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Check TypeScript errors
npm run typecheck
```

### Database Issues
- Ensure all migrations are applied in order
- Check RLS policies in Supabase dashboard
- Verify environment variables are correct

### Authentication Issues
- Check Supabase auth configuration
- Verify redirect URLs in Supabase settings
- Ensure user roles are properly set in profiles table

## 📊 Database Schema

Key tables:
- `profiles`: User data with KYC status
- `properties`: Land records with public read access
- `transfers`: Land transfer workflows
- `property_owners`: Co-ownership records
- `collateral_loans`: Bank loan management
- `collateral_insurance`: Insurance policies
- `collateral_valuations`: Property valuations
- `collateral_alerts`: Risk monitoring
- `payments`: Revenue tracking
- `banks`: Bank API partners

## 🔄 Updates

The project uses Supabase migrations for schema changes. Always test migrations in development before applying to production.

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For issues and support, contact the development team.

---

**Note**: Admin role system is intentionally disabled in this version. The system focuses on user-facing features and bank collateral management.