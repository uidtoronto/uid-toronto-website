import { supabase } from '../lib/supabase';
import type { BoardMember, BoardMemberInput } from '../types';

const TABLE = 'board_members';

export async function getBoardMembers(): Promise<{ data: BoardMember[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data as BoardMember[]) ?? [], error: null };
}

export async function getAllBoardMembersAdmin(): Promise<{ data: BoardMember[]; error: string | null }> {
  return getBoardMembers();
}

export async function createBoardMember(
  input: BoardMemberInput,
): Promise<{ data: BoardMember | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).insert(input).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as BoardMember, error: null };
}

export async function updateBoardMember(
  id: string,
  input: Partial<BoardMemberInput>,
): Promise<{ data: BoardMember | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as BoardMember, error: null };
}

export async function deleteBoardMember(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function reorderBoardMembers(
  orderedIds: string[],
): Promise<{ error: string | null }> {
  const updates = orderedIds.map((id, index) =>
    supabase.from(TABLE).update({ sort_order: index }).eq('id', id),
  );
  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  return { error: failed?.error?.message ?? null };
}
