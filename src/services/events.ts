import { supabase } from '../lib/supabase';
import { combineEventDateTime } from '../lib/localizedContent';
import type { EventInput, EventRecord, MemberEvent } from '../types';

const TABLE = 'events';

function mapToMemberEvent(row: EventRecord, lang: 'EN' | 'TR'): MemberEvent {
  return {
    id: row.id,
    title: lang === 'TR' && row.title_tr ? row.title_tr : row.title_en,
    description: lang === 'TR' && row.description_tr ? row.description_tr : row.description_en,
    date: combineEventDateTime(row.event_date, row.event_time),
    location: row.location,
    image_url: row.image_url,
  };
}

export async function getUpcomingEvents(limit = 6): Promise<{ data: EventRecord[]; error: string | null }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data as EventRecord[]) ?? [], error: null };
}

export async function getUpcomingEventsLocalized(
  limit = 6,
  lang: 'EN' | 'TR' = 'EN',
): Promise<{ data: MemberEvent[]; error: string | null }> {
  const res = await getUpcomingEvents(limit);
  if (res.error) return { data: [], error: res.error };
  return { data: res.data.map(r => mapToMemberEvent(r, lang)), error: null };
}

export async function getAllEventsAdmin(): Promise<{ data: EventRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data as EventRecord[]) ?? [], error: null };
}

export async function getEventById(id: string): Promise<{ data: EventRecord | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: data as EventRecord | null, error: null };
}

export async function createEvent(input: EventInput): Promise<{ data: EventRecord | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).insert(input).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as EventRecord, error: null };
}

export async function updateEvent(
  id: string,
  input: Partial<EventInput>,
): Promise<{ data: EventRecord | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as EventRecord, error: null };
}

export async function deleteEvent(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function setEventPublished(
  id: string,
  isPublished: boolean,
): Promise<{ error: string | null }> {
  const res = await updateEvent(id, { is_published: isPublished });
  return { error: res.error };
}
