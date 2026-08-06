import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadCmsImage, type StorageBucket } from '../../services/storage';
import { adminTr } from '../../lib/adminTr';

interface ImageUploadProps {
  bucket: StorageBucket;
  folderId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ImageUpload({ bucket, folderId, value, onChange, label = adminTr.featuredImage }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    const res = await uploadCmsImage(bucket, file, folderId);
    setUploading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onChange(res.url ?? null);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: 'var(--text-mid)' }}>
        {label}
      </p>
      {value ? (
        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(13,77,124,0.12)', maxWidth: '320px' }}>
          <img src={value} alt={label} loading="lazy" decoding="async" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={adminTr.removeImage}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '28px', height: '28px', borderRadius: '50%',
              border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', maxWidth: '320px', padding: '2rem 1rem',
            borderRadius: '12px', border: '1.5px dashed rgba(13,77,124,0.2)',
            background: 'rgba(255,255,255,0.8)', cursor: uploading ? 'wait' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-mid)',
          }}
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          {uploading ? adminTr.uploading : adminTr.uploadImage}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      {error && <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: '#dc2626', fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
    </div>
  );
}
