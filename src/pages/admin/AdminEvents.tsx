import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { TextField, TextAreaField } from '../../components/admin/AdminField';
import { ImageUpload } from '../../components/admin/ImageUpload';
import {
  getAllEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventPublished,
} from '../../services/events';
import type { EventInput, EventRecord } from '../../types';

const emptyForm: EventInput = {
  title_en: '',
  title_tr: '',
  description_en: '',
  description_tr: '',
  event_date: '',
  event_time: '18:00',
  location: '',
  image_url: null,
  is_published: false,
};

export default function AdminEvents() {
  const { toast } = useToast();
  const [items, setItems] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm);
  const [uploadFolder, setUploadFolder] = useState<string>(() => crypto.randomUUID());

  const load = async () => {
    setLoading(true);
    const res = await getAllEventsAdmin();
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

  const startEdit = (item: EventRecord) => {
    setEditingId(item.id);
    setUploadFolder(item.id);
    setForm({
      title_en: item.title_en,
      title_tr: item.title_tr,
      description_en: item.description_en,
      description_tr: item.description_tr,
      event_date: item.event_date,
      event_time: item.event_time.slice(0, 5),
      location: item.location,
      image_url: item.image_url,
      is_published: item.is_published,
    });
  };

  const handleSave = async () => {
    if (!form.title_en.trim() || !form.description_en.trim() || !form.event_date || !form.location.trim()) {
      toast('Title, description, date, and location are required.', 'error');
      return;
    }
    setSaving(true);
    const res = editingId === 'new'
      ? await createEvent(form)
      : await updateEvent(editingId!, form);
    setSaving(false);
    if (res.error) {
      toast(res.error, 'error');
      return;
    }
    toast(editingId === 'new' ? 'Event created.' : 'Event updated.', 'success');
    setEditingId(null);
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const res = await deleteEvent(id);
    if (res.error) toast(res.error, 'error');
    else {
      toast('Event deleted.', 'success');
      if (editingId === id) setEditingId(null);
      void load();
    }
  };

  const togglePublish = async (item: EventRecord) => {
    const res = await setEventPublished(item.id, !item.is_published);
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
          <h1 style={{ margin: '0.25rem 0 0', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 400, color: 'var(--uid-navy)' }}><em>Events</em></h1>
        </div>
        <button type="button" onClick={startNew} style={primaryBtn}><Plus size={16} /> New event</button>
      </div>

      {editingId && (
        <div style={panelStyle}>
          <h2 style={panelTitle}>{editingId === 'new' ? 'Create event' : 'Edit event'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 1rem' }}>
            <TextField label="Title (English) *" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} />
            <TextField label="Title (Turkish)" value={form.title_tr} onChange={e => setForm(f => ({ ...f, title_tr: e.target.value }))} />
            <TextField label="Date *" type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            <TextField label="Time *" type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
            <TextField label="Location *" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <TextAreaField label="Description (English) *" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
          <TextAreaField label="Description (Turkish)" value={form.description_tr} onChange={e => setForm(f => ({ ...f, description_tr: e.target.value }))} />
          <ImageUpload bucket="event-images" folderId={uploadFolder} value={form.image_url ?? null} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--uid-navy)' }}>
            <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
            Publish immediately
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={() => void handleSave()} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setEditingId(null)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={panelStyle}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={24} style={{ color: 'var(--uid-teal)' }} /></div>
        ) : items.length === 0 ? (
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: 'var(--text-soft)' }}>No events yet.</p>
        ) : (
          items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid rgba(13,77,124,0.06)' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--uid-navy)' }}>{item.title_en}</p>
                <p style={{ margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'var(--text-soft)' }}>
                  {item.event_date} {item.event_time.slice(0, 5)} · {item.location} · {item.is_published ? 'Published' : 'Draft'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
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
