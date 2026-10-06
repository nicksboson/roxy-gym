import React, { memo, useEffect, useState } from 'react';
import { initials } from '../utils';

function MemberAvatar({ src, name, className = 'member-photo', style, size }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const combinedStyle = size
    ? { width: size, height: size, minWidth: size, minHeight: size, ...style }
    : style;

  if (src && !hasError) {
    return (
      <img
        className={className}
        src={src}
        alt={name || 'Member photo'}
        onError={() => setHasError(true)}
        style={combinedStyle}
      />
    );
  }

  return (
    <div className={`avatar ${className}`} style={combinedStyle}>
      {initials(name)}
    </div>
  );
}

export default memo(MemberAvatar);
