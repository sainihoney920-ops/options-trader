import AppShell from '@/components/app-shell'
import ScannerPage from '../scanner-page'

export default function ScannerRoute() {
  return (
    <AppShell>
      <ScannerPage user={null} />
    </AppShell>
  )
}
