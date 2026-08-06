import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  altPrefix?: string;
}

const ZOOM_LEVEL = 2;
const MIN_PINCH_SCALE = 1;
const MAX_PINCH_SCALE = 3;

function preloadImage(url: string) {
  const img = new Image();
  img.src = url;
}

export default function Lightbox({ images, initialIndex, onClose, altPrefix = '' }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [pinchScale, setPinchScale] = useState(1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const currentSrc = images[index];
  const prevSrc = images.length > 1 ? images[index > 0 ? index - 1 : images.length - 1] : null;
  const nextSrc = images.length > 1 ? images[index < images.length - 1 ? index + 1 : 0] : null;

  const goPrev = useCallback(() => {
    setZoomed(false);
    setPinchScale(1);
    setLoading(true);
    setIndex(i => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setPinchScale(1);
    setLoading(true);
    setIndex(i => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    if (prevSrc) preloadImage(prevSrc);
    if (nextSrc) preloadImage(nextSrc);
  }, [prevSrc, nextSrc]);

  useEffect(() => {
    setLoading(true);
    setZoomed(false);
    setPinchScale(1);
  }, [currentSrc]);

  const handleImageClick = () => {
    if (window.matchMedia('(pointer: fine)').matches) {
      setZoomed(z => !z);
    }
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = { distance: getTouchDistance(e.touches), scale: pinchScale };
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const distance = getTouchDistance(e.touches);
      const ratio = distance / pinchStart.current.distance;
      const next = Math.min(MAX_PINCH_SCALE, Math.max(MIN_PINCH_SCALE, pinchStart.current.scale * ratio));
      setPinchScale(next);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length > 0) return;
    pinchStart.current = null;

    if (pinchScale <= 1.05) {
      setPinchScale(1);
    }

    if (!touchStart.current || pinchScale > 1.05) {
      touchStart.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  if (!images.length) return null;

  const scale = zoomed ? ZOOM_LEVEL : pinchScale;
  const isZoomed = zoomed || pinchScale > 1.05;

  return (
    <div
      ref={backdropRef}
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Galeri"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button ref={closeRef} type="button" className="lightbox-close" onClick={onClose} aria-label="Kapat">
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button type="button" className="lightbox-nav lightbox-nav-prev" onClick={goPrev} aria-label="Önceki">
            <ChevronLeft size={28} />
          </button>
          <button type="button" className="lightbox-nav lightbox-nav-next" onClick={goNext} aria-label="Sonraki">
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div
        className={`lightbox-content${isZoomed ? ' lightbox-content-zoomed' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {loading && (
          <div className="lightbox-spinner" aria-hidden="true">
            <Loader2 size={36} className="animate-spin" />
          </div>
        )}
        <img
          key={currentSrc}
          src={currentSrc}
          alt={altPrefix ? `${altPrefix} ${index + 1}` : `Görsel ${index + 1}`}
          className={`lightbox-image${loading ? ' lightbox-image-loading' : ''}`}
          draggable={false}
          loading="eager"
          decoding="async"
          style={{
            transform: `scale(${scale})`,
          }}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          onClick={handleImageClick}
        />
      </div>

      {images.length > 1 && (
        <p className="lightbox-counter" aria-live="polite">{index + 1} / {images.length}</p>
      )}
    </div>
  );
}
