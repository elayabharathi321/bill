import PlaceholderPage from '../../components/common/PlaceholderPage';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Configure store details, tax rates, invoice preferences and more."
      icon={SettingsIcon}
    />
  );
}