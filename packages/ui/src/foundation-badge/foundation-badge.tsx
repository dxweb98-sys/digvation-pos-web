import { Badge } from '../badge';

export function FoundationBadge() {
  return (
    <Badge
      variant="outline"
      dot
      dotClassName="bg-[var(--color-success)]"
      className="gap-2 px-3 py-1 font-semibold text-[var(--color-text-muted)]"
    >
      Frontend Foundation
    </Badge>
  );
}
