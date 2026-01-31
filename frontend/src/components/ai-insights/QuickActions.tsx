import { Button } from '../shared/Button';

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary">
        Assign Emma
      </Button>
      <Button size="sm" variant="secondary">
        View Details
      </Button>
      <Button size="sm" variant="secondary">
        View Full History
      </Button>
    </div>
  );
}
