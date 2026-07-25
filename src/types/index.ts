// ───────────────────────────────────────────────────────────
// Database Types
// ───────────────────────────────────────────────────────────

export type MembershipType = 'student' | 'individual' | 'family' | 'lifetime';
export type MembershipStatus = 'active' | 'expired' | 'pending' | 'suspended';
export type UserRole = 'member' | 'super_admin';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string | null;
  membership_type: MembershipType;
  membership_status: MembershipStatus;
  renewal_date: string | null;
  discount_code: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface Membership {
  id: string;
  profile_id: string;
  type: MembershipType;
  status: MembershipStatus;
  start_date: string;
  renewal_date: string | null;
  price_paid: number;
  payment_id?: string | null;
  created_at?: string;
}

export interface MemberEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  image_url?: string | null;
  url?: string | null;
}

export interface MemberNews {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  url?: string | null;
  image_url?: string | null;
}

export type PublishStatus = 'draft' | 'published';

export interface NewsPost {
  id: string;
  title_en: string;
  title_tr: string;
  excerpt_en: string;
  excerpt_tr: string;
  body_en: string | null;
  body_tr: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsPostInput {
  title_en: string;
  title_tr: string;
  excerpt_en: string;
  excerpt_tr: string;
  body_en?: string;
  body_tr?: string;
  image_url?: string | null;
  is_published: boolean;
}

export interface EventRecord {
  id: string;
  title_en: string;
  title_tr: string;
  description_en: string;
  description_tr: string;
  event_date: string;
  event_time: string;
  location: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title_en: string;
  title_tr: string;
  description_en: string;
  description_tr: string;
  event_date: string;
  event_time: string;
  location: string;
  image_url?: string | null;
  is_published: boolean;
}

export interface MemberUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  mobile_phone?: string | null;
  city?: string | null;
  status?: MemberStatus;
  membership_type?: RegistrationMembershipType | null;
  address_line1?: string | null;
  address_line2?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  profile_photo_url?: string | null;
}

export interface AuthSession {
  user: Profile | null;
  isAuthenticated: boolean;
}

export interface AuthResult {
  user: Profile | null;
  error?: string;
}

// ───────────────────────────────────────────────────────────
// Member Management Types
// ───────────────────────────────────────────────────────────

export type MemberStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type PaymentStatus = 'pending' | 'active' | 'failed' | 'cancelled';
export type RegistrationMembershipType = 'adult' | 'student' | 'pensioner';

export interface FamilyMember {
  id?: string;
  member_id?: string;
  full_name: string;
  age?: number | null;
  gender?: 'male' | 'female' | null;
  member_type?: 'adult' | 'child' | null;
  created_at?: string;
}

export interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city?: string | null;
  status: MemberStatus;
  created_at: string;
  // Extended registration fields
  birth_date?: string | null;
  mobile_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  membership_type?: RegistrationMembershipType | null;
  is_family?: boolean;
  payment_status?: PaymentStatus;
  stripe_customer_id?: string | null;
  stripe_checkout_id?: string | null;
  stripe_session_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  renewal_date?: string | null;
  last_payment_date?: string | null;
  auth_user_id?: string | null;
  profile_photo_url?: string | null;
  updated_at?: string;
  family_members?: FamilyMember[];
}

export interface MemberStats {
  total: number;
  byStatus: { status: MemberStatus; count: number }[];
  byMembershipType: { type: RegistrationMembershipType; count: number }[];
  byPaymentStatus: { status: PaymentStatus; count: number }[];
  activeSubscriptions: number;
}

export interface RegistrationInput {
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
  mobile_phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  membership_type: RegistrationMembershipType;
  is_family: boolean;
  family_members?: FamilyMember[];
}

export interface Donation {
  id: string;
  amount: number;
  email: string | null;
  stripe_payment_intent_id: string;
  stripe_checkout_session_id: string | null;
  created_at: string;
}

export interface DonationStats {
  totalCount: number;
  totalAmountCents: number;
}

// ───────────────────────────────────────────────────────────
// Board Members & Projects CMS
// ───────────────────────────────────────────────────────────

export interface BoardMember {
  id: string;
  name_en: string;
  name_tr: string;
  description_en: string;
  description_tr: string;
  position_en: string;
  position_tr: string;
  photo_url: string | null;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BoardMemberInput {
  name_en: string;
  name_tr: string;
  description_en?: string;
  description_tr?: string;
  position_en: string;
  position_tr: string;
  photo_url?: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface Project {
  id: string;
  title_en: string;
  title_tr: string;
  description_en: string;
  description_tr: string;
  cover_image_url: string | null;
  gallery_urls: string[];
  project_date: string;
  category_en: string;
  category_tr: string;
  is_featured: boolean;
  is_published: boolean;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInput {
  title_en: string;
  title_tr: string;
  description_en: string;
  description_tr: string;
  cover_image_url?: string | null;
  gallery_urls?: string[];
  project_date: string;
  category_en: string;
  category_tr: string;
  is_featured: boolean;
  is_published: boolean;
  instagram_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
}
