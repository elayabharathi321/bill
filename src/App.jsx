import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/common/Toast';
import { ConfirmDialogProvider } from './components/common/ConfirmDialog';

/**
 * Root application component.
 * Providers wrap the router so that toast and confirmation
 * dialogs are available across the entire application.
 */
function App() {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <AppRoutes />
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

export default App;