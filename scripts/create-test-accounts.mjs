/**
 * ARIA Test Account Setup Script
 * --------------------------------
 * Creates (or recreates) the 3 test accounts with confirmed emails and correct profiles.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-test-accounts.mjs
 *
 * Get your service_role key from:
 *   Supabase Dashboard → Project Settings → API → service_role (secret)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://phrjpqwvponapoedlbrz.supabase.co';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Missing SUPABASE_SERVICE_ROLE_KEY env var.');
  console.error('   Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-test-accounts.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_ACCOUNTS = [
  { email: 'personal@test.com', password: 'TestARIA99',  name: 'Personal Tester', plan: 'personal',  price: 99  },
  { email: 'business@test.com', password: 'TestARIA299', name: 'Business Tester', plan: 'business',  price: 299 },
  { email: 'premium@test.com',  password: 'TestARIA500', name: 'Premium Tester',  plan: 'premium',   price: 500 },
];

async function run() {
  console.log('🔧  Setting up ARIA test accounts...\n');

  for (const account of TEST_ACCOUNTS) {
    process.stdout.write(`  ${account.email} (${account.plan})... `);

    // 1. Check if user already exists
    const { data: { users: existing } } = await supabase.auth.admin.listUsers();
    const found = existing.find(u => u.email === account.email);

    // 2. Delete if exists
    if (found) {
      await supabase.auth.admin.deleteUser(found.id);
    }

    // 3. Create with email confirmed
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email:             account.email,
      password:          account.password,
      email_confirm:     true,                   // skips email verification
      user_metadata:     { name: account.name, plan: account.plan },
    });

    if (createErr || !created?.user) {
      console.log(`❌  Failed: ${createErr?.message}`);
      continue;
    }

    const userId = created.user.id;

    // 4. Upsert profile row
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id:                   userId,
      name:                 account.name,
      plan:                 account.plan,
      monthly_price:        account.price,
      active:               true,
      on_trial:             false,
      onboarding_completed: true,              // skip tour for test accounts
    }, { onConflict: 'id' });

    if (profileErr) {
      console.log(`⚠️   Created but profile failed: ${profileErr.message}`);
    } else {
      console.log(`✅  Done (id: ${userId.slice(0,8)}...)`);
    }
  }

  console.log('\n✅  All test accounts ready.\n');
  console.log('  personal@test.com  / TestARIA99   → Personal plan');
  console.log('  business@test.com  / TestARIA299  → Business plan');
  console.log('  premium@test.com   / TestARIA500  → Premium plan');
  console.log('\n  All emails confirmed. Log in at http://localhost:5174/login\n');
}

run().catch(err => { console.error('\n❌  Unexpected error:', err.message); process.exit(1); });
