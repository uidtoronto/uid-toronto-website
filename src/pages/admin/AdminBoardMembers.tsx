import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { TextField, TextAreaField } from '../../components/admin/AdminField';
import { ImageUpload } from '../../components/admin/ImageUpload';
import {
  getAllBoardMembersAdmin,
  createBoardMember,
  updateBoardMember,
  deleteBoardMember,
  reorderBoardMembers,
} from '../../services/boardMembers';
import type { BoardMember, BoardMemberInput } from '../../types';

const emptyForm: BoardMemberInput = {
  name_en: '',
  name_tr: '',
  description_en: '',
  description_tr: '',
  position_en: '',
  position_tr: '',
  photo_url: null,
  is_featured: false,
  sort_order: 0,
};

export default function AdminBoardMembers() {
  const { toast } = useToast();
  const [items, setItems] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<BoardMemberInput>(emptyForm);
  const [uploadFolder, setUploadFolder] = useState<string>(() => crypto.randomUUID());
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await getAllBoardMembersAdmin();
    setItems(res.data);
    if (res.error) toast(res.error, 'error');
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const startNew = () => {
    setEditingId('new');
    setForm({ ...emptyForm, sort_order: items.length });
    setUploadFolder(crypto.randomUUID());
  };

  const startEdit = (item: BoardMember) => {
    setEditingId(item.id);
    setUploadFolder(item.id);
    setForm({
      name_en: item.name_en,
      name_tr: item.name_tr,
      description_en: item.description_en,
      description_tr: item.description_tr,
      position_en: item.position_en,
      position_tr: item.position_tr,
      photo_url: item.photo_url,
      is_featured: item.is_featured,
      sort_order: item.sort_order,
    });
  };

  const handleSave = async () => {
    if (!form.position_en.trim()) {
      toast('English position is required.', 'error');
      return;
    }
    setSaving(true);
    const res = editingId === 'new'
      ? await createBoardMember(form)
      : await updateBoardMember(editingId!, form);
    setSaving(false);
    if (res.error) {
      toast(res.error, 'error');
      return;
    }
    toast(editingId === 'new' ? 'Board member created.' : 'Board member updated.', 'success');
    setEditingId(null);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this board member?')) return;
    const res = await deleteBoardMember(id);
    if (res.error) toast(res.error, 'error');
    else {
      toast('Board member deleted.', 'success');
      if (editingId === id) setEditingId(null);
      void load();
    }
  };

  const handleDragStart = (index: number) => setDragIdx(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(index, 0, moved);
    setItems(next);
    setDragIdx(index);
  };

  const handleDragEnd = async () => {
    if (dragIdx === null) return;
    setDragIdx(null);
    const res = await reorderBoardMembers(items.map(i => i.id));
    if (res.error) {
      toast(res.error, 'error');
      void load();
    } else {
      toast('Order saved.', 'success');
    }
  };

  return (
    <div className="admin-fade-up">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--uid-teal-dark)', fontWeight: 600 }}>Content</p>
          <h1 style={{ margin: '0.25rem 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)' }}><em>Board Members</em></h1>
        </div>
        <button type="button" onClick={startNew} style={primaryBtn}>
          <Plus size={16} /> New member
        </button>
      </div>

      {editingId && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>{editingId === 'new' ? 'Create board member' : 'Edit board member'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label="Name (English)" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
            <TextField label="Name (Turkish)" value={form.name_tr} onChange={e => setForm(f => ({ ...f, name_tr: e.target.value }))} />
            <TextField label="Position (English) *" value={form.position_en} onChange={e => setForm(f => ({ ...f, position_en: e.target.value }))} />
            <TextField label="Position (Turkish)" value={form.position_tr} onChange={e => setForm(f => ({ ...f, position_tr: e.target.value }))} />
          </div>
          <TextAreaField label="Description (English)" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
          <TextAreaField label="Description (Turkish)" value={form.description_tr} onChange={e => setForm(f => ({ ...f, description_tr: e.target.value }))} />
          <ImageUpload bucket="board-photos" folderId={uploadFolder} value={form.photo_url ?? null} onChange={url => setForm(f => ({ ...f, photo_url: url }))} label="Profile photo" />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--uid-navy)' }}>
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
            Featured (President / Secretary row)
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => void handleSave()} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setEditingId(null)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={panelStyle}>
        <p style={{ margin: '0 0 1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>
          Drag rows to reorder. Order is reflected on the public BYK section.
        </p>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--uid-teal)' }} /></div>
        ) : items.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-soft)' }}>No board members yet.</p>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={() => void handleDragEnd()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                padding: '0.875rem 0', borderBottom: '1px solid rgba(13,77,124,0.06)',
                opacity: dragIdx === index ? 0.5 : 1, cursor: 'grab',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                <GripVertical size={16} style={{ color: 'var(--text-soft)', flexShrink: 0 }} />
                {item.photo_url ? (
                  <img src={item.photo_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(62,200,200,0.15)', flexShrink: 0 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)' }}>
                    {item.name_en || item.name_tr || '(No name)'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>
                    {item.position_en}{item.is_featured ? ' · Featured' : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
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
