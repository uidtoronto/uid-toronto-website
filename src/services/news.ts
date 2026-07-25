import { supabase } from '../lib/supabase';
import type { MemberNews, NewsPost, NewsPostInput } from '../types';

const TABLE = 'news_posts';

function mapToMemberNews(row: NewsPost, lang: 'EN' | 'TR'): MemberNews {
  return {
    id: row.id,
    title: lang === 'TR' && row.title_tr ? row.title_tr : row.title_en,
    excerpt: lang === 'TR' && row.excerpt_tr ? row.excerpt_tr : row.excerpt_en,
    date: row.published_at ?? row.created_at,
    image_url: row.image_url,
  };
}

export async function getPublishedNews(limit = 6): Promise<{ data: NewsPost[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data as NewsPost[]) ?? [], error: null };
}

export async function getPublishedNewsLocalized(
  limit = 6,
  lang: 'EN' | 'TR' = 'EN',
): Promise<{ data: MemberNews[]; error: string | null }> {
  const res = await getPublishedNews(limit);
  if (res.error) return { data: [], error: res.error };
  return { data: res.data.map(r => mapToMemberNews(r, lang)), error: null };
}

export async function getAllNewsAdmin(): Promise<{ data: NewsPost[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as NewsPost[]) ?? [], error: null };
}

export async function getNewsById(id: string): Promise<{ data: NewsPost | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: data as NewsPost | null, error: null };
}

export async function createNews(input: NewsPostInput): Promise<{ data: NewsPost | null; error: string | null }> {
  const payload = {
    ...input,
    published_at: input.is_published ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as NewsPost, error: null };
}

export async function updateNews(
  id: string,
  input: Partial<NewsPostInput>,
): Promise<{ data: NewsPost | null; error: string | null }> {
  const payload: Record<string, unknown> = { ...input };
  if (input.is_published === true) {
    payload.published_at = new Date().toISOString();
  }
  if (input.is_published === false) {
    payload.published_at = null;
  }

  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as NewsPost, error: null };
}

export async function deleteNews(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function setNewsPublished(
  id: string,
  isPublished: boolean,
): Promise<{ error: string | null }> {
  const res = await updateNews(id, { is_published: isPublished });
  return { error: res.error };
}
