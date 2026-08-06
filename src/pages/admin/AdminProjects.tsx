import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAdminSuccess } from '../../context/AdminSuccessContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useAdminEditorGuard } from '../../hooks/useAdminEditorGuard';
import UnsavedChangesPrompt from '../../components/admin/UnsavedChangesPrompt';
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
import { adminTr } from '../../lib/adminTr';
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
  const { showSuccessFor } = useAdminSuccess();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<ProjectInput>(emptyForm);
  const [uploadFolder, setUploadFolder] = useState<string>(() => crypto.randomUUID());
  const [isDirty, setIsDirty] = useState(false);

  const discardEdit = useCallback(() => { setEditingId(null); setIsDirty(false); }, []);
  const { showUnsavedDialog, confirmLeave, cancelLeave, requestCancel } = useAdminEditorGuard(editingId !== null, isDirty, discardEdit);
  const patchForm = useCallback((patch: Partial<ProjectInput> | ((f: ProjectInput) => ProjectInput)) => {
    setForm(typeof patch === 'function' ? patch : f => ({ ...f, ...patch }));
    setIsDirty(true);
  }, []);

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
    setIsDirty(false);
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
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!form.title_en.trim() || !form.description_en.trim()) {
      toast(adminTr.projectRequired, 'error');
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
    showSuccessFor('project', editingId === 'new' ? 'created' : 'updated');
    setEditingId(null);
    setIsDirty(false);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!await confirm(adminTr.confirmDeleteProject)) return;
    const res = await deleteProject(id);
    if (res.error) toast(res.error, 'error');
    else {
      showSuccessFor('project', 'deleted');
      if (editingId === id) discardEdit();
      void load();
    }
  };

  const togglePublish = async (item: Project) => {
    const res = await setProjectPublished(item.id, !item.is_published);
    if (res.error) toast(res.error, 'error');
    else {
      showSuccessFor('project', item.is_published ? 'unpublished' : 'published');
      void load();
    }
  };

  return (
    <div className="admin-fade-up">
      <UnsavedChangesPrompt open={showUnsavedDialog} onConfirm={confirmLeave} onCancel={cancelLeave} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal-dark)', fontWeight: 600 }}>{adminTr.content}</p>
          <h1 style={{ margin: '0.25rem 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)' }}><em>{adminTr.projects}</em></h1>
        </div>
        <button type="button" onClick={startNew} style={primaryBtn}>
          <Plus size={16} /> {adminTr.newProject}
        </button>
      </div>

      {editingId && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>{editingId === 'new' ? adminTr.createProject : adminTr.editProject}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label={adminTr.titleEn} value={form.title_en} onChange={e => patchForm({ title_en: e.target.value })} />
            <TextField label={adminTr.titleTr} value={form.title_tr} onChange={e => patchForm({ title_tr: e.target.value })} />
            <TextField label={adminTr.categoryEn} value={form.category_en} onChange={e => patchForm({ category_en: e.target.value })} />
            <TextField label={adminTr.categoryTr} value={form.category_tr} onChange={e => patchForm({ category_tr: e.target.value })} />
            <TextField label={adminTr.projectDate} type="date" value={form.project_date} onChange={e => patchForm({ project_date: e.target.value })} />
          </div>
          <TextAreaField label={adminTr.descriptionEn} value={form.description_en} onChange={e => patchForm({ description_en: e.target.value })} />
          <TextAreaField label={adminTr.descriptionTr} value={form.description_tr} onChange={e => patchForm({ description_tr: e.target.value })} />
          <ImageUpload bucket="project-images" folderId={uploadFolder} value={form.cover_image_url ?? null} onChange={url => patchForm({ cover_image_url: url })} label={adminTr.coverImage} />
          <GalleryUpload bucket="project-images" folderId={uploadFolder} value={form.gallery_urls ?? []} onChange={urls => patchForm({ gallery_urls: urls })} />
          <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: 'var(--text-mid)' }}>{adminTr.socialLinks}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label="Instagram" value={form.instagram_url ?? ''} onChange={e => patchForm({ instagram_url: e.target.value || null })} />
            <TextField label="Facebook" value={form.facebook_url ?? ''} onChange={e => patchForm({ facebook_url: e.target.value || null })} />
            <TextField label="YouTube" value={form.youtube_url ?? ''} onChange={e => patchForm({ youtube_url: e.target.value || null })} />
            <TextField label="TikTok" value={form.tiktok_url ?? ''} onChange={e => patchForm({ tiktok_url: e.target.value || null })} />
            <TextField label="Website" value={form.website_url ?? ''} onChange={e => patchForm({ website_url: e.target.value || null })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--uid-navy)' }}>
            <input type="checkbox" checked={form.is_featured} onChange={e => patchForm({ is_featured: e.target.checked })} />
            {adminTr.featuredHomepage}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--uid-navy)' }}>
            <input type="checkbox" checked={form.is_published} onChange={e => patchForm({ is_published: e.target.checked })} />
            {adminTr.publishImmediately}
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => void handleSave()} disabled={saving} style={primaryBtn}>{saving ? adminTr.saving : adminTr.save}</button>
            <button type="button" onClick={() => void requestCancel()} style={secondaryBtn}>{adminTr.cancel}</button>
          </div>
        </div>
      )}

      <div style={panelStyle}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--uid-teal)' }} /></div>
        ) : items.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-soft)' }}>{adminTr.noProjects}</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="admin-list-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)' }}>{item.title_en}</p>
                <p style={{ margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>
                  {item.is_published ? adminTr.published : adminTr.draft} ù {item.category_en} ù {item.project_date.slice(0, 4)}
                  {item.is_featured ? ` ù ${adminTr.featured}` : ''}
                </p>
              </div>
              <div className="admin-list-actions">
                <IconBtn onClick={() => togglePublish(item)} title={item.is_published ? adminTr.unpublish : adminTr.publish}>{item.is_published ? <EyeOff size={15} /> : <Eye size={15} />}</IconBtn>
                <IconBtn onClick={() => startEdit(item)} title={adminTr.edit}><Pencil size={15} /></IconBtn>
                <IconBtn onClick={() => void handleDelete(item.id)} title={adminTr.delete}><Trash2 size={15} /></IconBtn>
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
    <button type="button" title={title} aria-label={title} onClick={onClick} className="admin-icon-btn focus-ring">
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
