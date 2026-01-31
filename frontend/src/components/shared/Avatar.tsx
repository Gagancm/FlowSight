import { cn } from '../../utils/helpers';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const safeName = name ?? '';
  const initial = safeName.charAt(0).toUpperCase() || '?';
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] font-medium',
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={safeName} className="h-full w-full rounded-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}
