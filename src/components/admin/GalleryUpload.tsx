import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadCmsImage, type StorageBucket } from '../../services/storage';

interface GalleryUploadProps {
  bucket: StorageBucket;
  folderId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
}

export function GalleryUpload({ bucket, folderId, value, onChange, label = 'Gallery images' }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setError(null);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const res = await uploadCmsImage(bucket, file, folderId);
      if (res.error) {
        setError(res.error);
        break;
      }
      if (res.url) newUrls.push(res.url);
    }
    setUploading(false);
    if (newUrls.length) onChange([...value, ...newUrls]);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{ margin: '0 0 0.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', fontWeight: 600, color: 'var(--text-mid)' }}>
        {label}
      </p>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {value.map((url, i) => (
            <div key={`${url}-${i}`} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(13,77,124,0.12)', width: '100px', height: '80px' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove image"
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', maxWidth: '320px', padding: '1.25rem 1rem',
          borderRadius: '12px', border: '1.5px dashed rgba(13,77,124,0.2)',
          background: 'rgba(255,255,255,0.8)', cursor: uploading ? 'wait' : 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'var(--text-mid)',
        }}
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
        {uploading ? 'Uploading…' : 'Add gallery images'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          const files = e.target.files;
          if (files?.length) void handleFiles(files);
          e.target.value = '';
        }}
      />
      {error && <p style={{ margin: '0.5rem 0 0', fontSize: '12px', color: '#dc2626', fontFamily: "'DM Sans', sans-serif" }}>{error}</p>}
    </div>
  );
}
