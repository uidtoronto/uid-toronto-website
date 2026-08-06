import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAdminSuccess } from '../../context/AdminSuccessContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useAdminEditorGuard } from '../../hooks/useAdminEditorGuard';
import UnsavedChangesPrompt from '../../components/admin/UnsavedChangesPrompt';
import { TextField, TextAreaField } from '../../components/admin/AdminField';
import { ImageUpload } from '../../components/admin/ImageUpload';
import {
  getAllNewsAdmin,
  createNews,
  updateNews,
  deleteNews,
  setNewsPublished,
} from '../../services/news';
import { adminTr } from '../../lib/adminTr';
import type { NewsPost, NewsPostInput } from '../../types';

const emptyForm: NewsPostInput = {
  title_en: '',
  title_tr: '',
  excerpt_en: '',
  excerpt_tr: '',
  body_en: '',
  body_tr: '',
  image_url: null,
  is_published: false,
};

export default function AdminNews() {
  const { toast } = useToast();
  const { showSuccessFor } = useAdminSuccess();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<NewsPostInput>(emptyForm);
  const [uploadFolder, setUploadFolder] = useState<string>(() => crypto.randomUUID());
  const [isDirty, setIsDirty] = useState(false);

  const discardEdit = useCallback(() => {
    setEditingId(null);
    setIsDirty(false);
  }, []);

  const { showUnsavedDialog, confirmLeave, cancelLeave, requestCancel } = useAdminEditorGuard(
    editingId !== null,
    isDirty,
    discardEdit,
  );

  const patchForm = useCallback((patch: Partial<NewsPostInput> | ((f: NewsPostInput) => NewsPostInput)) => {
    setForm(typeof patch === 'function' ? patch : f => ({ ...f, ...patch }));
    setIsDirty(true);
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await getAllNewsAdmin();
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

  const startEdit = (item: NewsPost) => {
    setEditingId(item.id);
    setUploadFolder(item.id);
    setForm({
      title_en: item.title_en,
      title_tr: item.title_tr,
      excerpt_en: item.excerpt_en,
      excerpt_tr: item.excerpt_tr,
      body_en: item.body_en ?? '',
      body_tr: item.body_tr ?? '',
      image_url: item.image_url,
      is_published: item.is_published,
    });
    setIsDirty(false);
  };

  const handleSave = async () => {
    if (!form.title_en.trim() || !form.excerpt_en.trim()) {
      toast(adminTr.newsTitleRequired, 'error');
      return;
    }
    setSaving(true);
    const res = editingId === 'new'
      ? await createNews(form)
      : await updateNews(editingId!, form);
    setSaving(false);
    if (res.error) {
      toast(res.error, 'error');
      return;
    }
    showSuccessFor('news', editingId === 'new' ? 'created' : 'updated');
    setEditingId(null);
    setIsDirty(false);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!await confirm(adminTr.confirmDeleteNews)) return;
    const res = await deleteNews(id);
    if (res.error) toast(res.error, 'error');
    else {
      showSuccessFor('news', 'deleted');
      if (editingId === id) discardEdit();
      void load();
    }
  };

  const togglePublish = async (item: NewsPost) => {
    const res = await setNewsPublished(item.id, !item.is_published);
    if (res.error) toast(res.error, 'error');
    else {
      showSuccessFor('news', item.is_published ? 'unpublished' : 'published');
      void load();
    }
  };

  return (
    <div className="admin-fade-up">
      <UnsavedChangesPrompt open={showUnsavedDialog} onConfirm={confirmLeave} onCancel={cancelLeave} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal-dark)', fontWeight: 600 }}>{adminTr.content}</p>
          <h1 style={{ margin: '0.25rem 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)' }}><em>{adminTr.news}</em></h1>
        </div>
        <button type="button" onClick={startNew} style={primaryBtn}>
          <Plus size={16} /> {adminTr.newArticle}
        </button>
      </div>

      {editingId && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>{editingId === 'new' ? adminTr.createNews : adminTr.editNews}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label={adminTr.titleEn} value={form.title_en} onChange={e => patchForm({ title_en: e.target.value })} />
            <TextField label={adminTr.titleTr} value={form.title_tr} onChange={e => patchForm({ title_tr: e.target.value })} />
            <TextAreaField label={adminTr.excerptEn} value={form.excerpt_en} onChange={e => patchForm({ excerpt_en: e.target.value })} />
            <TextAreaField label={adminTr.excerptTr} value={form.excerpt_tr} onChange={e => patchForm({ excerpt_tr: e.target.value })} />
          </div>
          <TextAreaField label={adminTr.bodyEn} value={form.body_en} onChange={e => patchForm({ body_en: e.target.value })} />
          <TextAreaField label={adminTr.bodyTr} value={form.body_tr} onChange={e => patchForm({ body_tr: e.target.value })} />
          <ImageUpload bucket="news-images" folderId={uploadFolder} value={form.image_url ?? null} onChange={url => patchForm({ image_url: url })} />
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
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-soft)' }}>{adminTr.noNews}</p>
        ) : (
          items.map(item => (
            <div key={item.id} className="admin-list-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)' }}>{item.title_en}</p>
                <p style={{ margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>
                  {item.is_published ? adminTr.published : adminTr.draft} · {new Date(item.updated_at).toLocaleDateString('tr-TR')}
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
