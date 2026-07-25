import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { TextField, TextAreaField } from '../../components/admin/AdminField';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { GalleryUpload } from '../../components/admin/GalleryUpload';
import {
  getAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
  setProjectPublished,
} from '../../services/projects';
import type { Project, ProjectInput } from '../../types';

const emptyForm: ProjectInput = {
  title_en: '',
  title_tr: '',
  description_en: '',
  description_tr: '',
  cover_image_url: null,
  gallery_urls: [],
  project_date: new Date().toISOString().slice(0, 10),
  category_en: '',
  category_tr: '',
  is_featured: false,
  is_published: false,
  instagram_url: null,
  facebook_url: null,
  youtube_url: null,
  tiktok_url: null,
  website_url: null,
};

export default function AdminProjects() {
  const { toast } = useToast();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<ProjectInput>(emptyForm);
  const [uploadFolder, setUploadFolder] = useState<string>(() => crypto.randomUUID());

  const load = async () => {
    setLoading(true);
    const res = await getAllProjectsAdmin();
    setItems(res.data);
    if (res.error) toast(res.error, 'error');
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const startNew = () => {
    setEditingId('new');
    setForm(emptyForm);
    setUploadFolder(crypto.randomUUID());
  };

  const startEdit = (item: Project) => {
    setEditingId(item.id);
    setUploadFolder(item.id);
    setForm({
      title_en: item.title_en,
      title_tr: item.title_tr,
      description_en: item.description_en,
      description_tr: item.description_tr,
      cover_image_url: item.cover_image_url,
      gallery_urls: item.gallery_urls ?? [],
      project_date: item.project_date,
      category_en: item.category_en,
      category_tr: item.category_tr,
      is_featured: item.is_featured,
      is_published: item.is_published,
      instagram_url: item.instagram_url,
      facebook_url: item.facebook_url,
      youtube_url: item.youtube_url,
      tiktok_url: item.tiktok_url,
      website_url: item.website_url,
    });
  };

  const handleSave = async () => {
    if (!form.title_en.trim() || !form.description_en.trim()) {
      toast('English title and description are required.', 'error');
      return;
    }
    setSaving(true);
    const res = editingId === 'new'
      ? await createProject(form)
      : await updateProject(editingId!, form);
    setSaving(false);
    if (res.error) {
      toast(res.error, 'error');
      return;
    }
    toast(editingId === 'new' ? 'Project created.' : 'Project updated.', 'success');
    setEditingId(null);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const res = await deleteProject(id);
    if (res.error) toast(res.error, 'error');
    else {
      toast('Project deleted.', 'success');
      if (editingId === id) setEditingId(null);
      void load();
    }
  };

  const togglePublish = async (item: Project) => {
    const res = await setProjectPublished(item.id, !item.is_published);
    if (res.error) toast(res.error, 'error');
    else {
      toast(item.is_published ? 'Unpublished.' : 'Published.', 'success');
      void load();
    }
  };

  return (
    <div className="admin-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal-dark)', fontWeight: 600 }}>Content</p>
          <h1 style={{ margin: '0.25rem 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)' }}><em>Projects</em></h1>
        </div>
        <button type="button" onClick={startNew} style={primaryBtn}>
          <Plus size={16} /> New project
        </button>
      </div>

      {editingId && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>{editingId === 'new' ? 'Create project' : 'Edit project'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label="Title (English) *" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} />
            <TextField label="Title (Turkish)" value={form.title_tr} onChange={e => setForm(f => ({ ...f, title_tr: e.target.value }))} />
            <TextField label="Category (English)" value={form.category_en} onChange={e => setForm(f => ({ ...f, category_en: e.target.value }))} />
            <TextField label="Category (Turkish)" value={form.category_tr} onChange={e => setForm(f => ({ ...f, category_tr: e.target.value }))} />
            <TextField label="Project date" type="date" value={form.project_date} onChange={e => setForm(f => ({ ...f, project_date: e.target.value }))} />
          </div>
          <TextAreaField label="Description (English) *" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
          <TextAreaField label="Description (Turkish)" value={form.description_tr} onChange={e => setForm(f => ({ ...f, description_tr: e.target.value }))} />
          <ImageUpload bucket="project-images" folderId={uploadFolder} value={form.cover_image_url ?? null} onChange={url => setForm(f => ({ ...f, cover_image_url: url }))} label="Cover image" />
          <GalleryUpload bucket="project-images" folderId={uploadFolder} value={form.gallery_urls ?? []} onChange={urls => setForm(f => ({ ...f, gallery_urls: urls }))} />
          <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: 'var(--text-mid)' }}>Social links (optional)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label="Instagram" value={form.instagram_url ?? ''} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value || null }))} />
            <TextField label="Facebook" value={form.facebook_url ?? ''} onChange={e => setForm(f => ({ ...f, facebook_url: e.target.value || null }))} />
            <TextField label="YouTube" value={form.youtube_url ?? ''} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value || null }))} />
            <TextField label="TikTok" value={form.tiktok_url ?? ''} onChange={e => setForm(f => ({ ...f, tiktok_url: e.target.value || null }))} />
            <TextField label="Website" value={form.website_url ?? ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value || null }))} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--uid-navy)' }}>
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
            Featured on homepage
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--uid-navy)' }}>
            <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
            Publish immediately
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => void handleSave()} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setEditingId(null)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={panelStyle}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--uid-teal)' }} /></div>
        ) : items.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-soft)' }}>No projects yet.</p>
        ) : (
          items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid rgba(13,77,124,0.06)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)' }}>{item.title_en}</p>
                <p style={{ margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>
                  {item.is_published ? 'Published' : 'Draft'} · {item.category_en} · {item.project_date.slice(0, 4)}
                  {item.is_featured ? ' · Featured' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <IconBtn onClick={() => togglePublish(item)} title={item.is_published ? 'Unpublish' : 'Publish'}>{item.is_published ? <EyeOff size={15} /> : <Eye size={15} />}</IconBtn>
                <IconBtn onClick={() => startEdit(item)} title="Edit"><Pencil size={15} /></IconBtn>
                <IconBtn onClick={() => void handleDelete(item.id)} title="Delete"><Trash2 size={15} /></IconBtn>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button type="button" title={title} onClick={onClick} style={{
      width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(13,77,124,0.12)',
      background: '#fff', color: 'var(--uid-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </button>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', padding: '1.5rem',
  border: '1px solid rgba(13,77,124,0.07)', boxShadow: '0 4px 20px rgba(13,77,124,0.05)', marginBottom: '1.25rem',
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '15px', fontWeight: 600, color: 'var(--uid-navy)',
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '99px',
  border: 'none', background: 'linear-gradient(135deg, #0D4D7C, #1A6A9A)', color: '#fff',
  fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', fontWeight: 500, cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 18px', borderRadius: '99px', border: '1.5px solid rgba(13,77,124,0.2)',
  background: '#fff', color: 'var(--uid-navy)', fontFamily: "'DM Sans', sans-serif", fontSize: '13.5px', cursor: 'pointer',
};
