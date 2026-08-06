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

const { error } = await supabase.auth.admin.deleteUser(userId);

if (error) {
  console.error(error);
} else {
  console.log('✅ User deleted successfully');
}
