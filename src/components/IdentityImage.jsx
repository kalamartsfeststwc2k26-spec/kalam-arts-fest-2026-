import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function IdentityImage({
  src,
  name,
  kind = 'team',
  className = '',
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const fallback = (name || '?').trim().slice(0, 2).toUpperCase();

  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-page text-burgundy ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`${kind === 'team' ? 'Logo of' : 'Photo of'} ${name}`}
          loading="lazy"
          className={`h-full w-full ${
            kind === 'team' ? 'object-contain' : 'object-cover'
          }`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-label={`${kind === 'team' ? 'No logo for' : 'No photo for'} ${name}`}
          className="flex flex-col items-center justify-center text-sm font-extrabold tracking-tight"
        >
          {fallback || <ImageOff size={18} aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}
