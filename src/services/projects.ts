import { supabase } from '../lib/supabase';
import type { Project, ProjectInput } from '../types';

const TABLE = 'projects';

export async function getPublishedProjects(): Promise<{ data: Project[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .order('project_date', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Project[]) ?? [], error: null };
}

export async function getFeaturedProjects(limit = 3): Promise<{ data: Project[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('project_date', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error: error.message };
  return { data: (data as Project[]) ?? [], error: null };
}

export async function getAllProjectsAdmin(): Promise<{ data: Project[]; error: string | null }> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('project_date', { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data as Project[]) ?? [], error: null };
}

export async function createProject(
  input: ProjectInput,
): Promise<{ data: Project | null; error: string | null }> {
  const payload = {
    ...input,
    gallery_urls: input.gallery_urls ?? [],
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as Project, error: null };
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>,
): Promise<{ data: Project | null; error: string | null }> {
  const { data, error } = await supabase.from(TABLE).update(input).eq('id', id).select('*').single();
  if (error) return { data: null, error: error.message };
  return { data: data as Project, error: null };
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function setProjectPublished(
  id: string,
  isPublished: boolean,
): Promise<{ error: string | null }> {
  const res = await updateProject(id, { is_published: isPublished });
  return { error: res.error };
}
