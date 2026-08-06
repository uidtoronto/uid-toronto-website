import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://shbmvnmjlnqqskhzpmgn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const userId = '746e8064-a70e-47b1-9b98-078dbdf564c3';

const fullName = process.env.FULL_NAME ?? 'UID ADMIN';
const firstName = process.env.FIRST_NAME ?? 'UID';
const lastName = process.env.LAST_NAME ?? 'Admin';

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  user_metadata: {
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
  },
});

if (error) {
  console.error(error);
} else {
  console.log('✅ User metadata updated successfully');
  console.log({ data });
}
