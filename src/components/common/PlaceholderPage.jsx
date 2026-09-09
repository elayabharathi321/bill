import { Construction } from 'lucide-react';
import PageHeader from './PageHeader';
import Card from './Card';

/**
 * Standard placeholder used for modules that have not been
 * implemented yet. Each module page passes its own title,
 * description and optional icon, so replacing the placeholder
 * with a real implementation is a one-file change.
 */
export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={description} />
      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            {Icon ? <Icon className="h-7 w-7" /> : <Construction className="h-7 w-7" />}
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">
            {title} module coming soon
          </h3>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            {description || 'This module is part of the application roadmap. It will be implemented in an upcoming iteration.'}
          </p>
        </div>
      </Card>
    </div>
  );
}