import WhatsAppBulkMessaging from '../components/WhatsAppBulkMessaging';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function WhatsAppBulkMessagingPage() {
  return (
    <DashboardLayout 
      title="WhatsApp Bulk Messaging"
      subtitle="Send bulk messages to multiple recipients using approved templates."
    >
      <WhatsAppBulkMessaging />
    </DashboardLayout>
  );
}