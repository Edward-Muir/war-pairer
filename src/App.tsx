import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';

// Implemented pages
import { HomePage } from '@/pages/HomePage';
import { TeamSetupPage } from '@/pages/TeamSetupPage';
import { TournamentSetupPage } from '@/pages/TournamentSetupPage';
import { RoundSetupPage } from '@/pages/RoundSetupPage';
import { MatrixEntryPage } from '@/pages/MatrixEntryPage';
import { PairingPhasePage } from '@/pages/PairingPhasePage';

// Placeholder pages - will be implemented in later phases
function TournamentSummaryPage() {
  return (
    <Layout title="Tournament" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Tournament summary page placeholder</p>
      </div>
    </Layout>
  );
}

function RoundSummaryPage() {
  return (
    <Layout title="Round Summary" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Round summary page placeholder</p>
      </div>
    </Layout>
  );
}

function SettingsPage() {
  return (
    <Layout title="Settings">
      <div className="p-4">
        <p className="text-gray-600">Settings page placeholder</p>
      </div>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Team management */}
        <Route path="/team/new" element={<TeamSetupPage />} />
        <Route path="/team/:id/edit" element={<TeamSetupPage />} />

        {/* Tournament management */}
        <Route path="/tournament/new" element={<TournamentSetupPage />} />
        <Route path="/tournament/:id" element={<TournamentSummaryPage />} />

        {/* Round flow */}
        <Route
          path="/tournament/:id/round/:roundIndex/setup"
          element={<RoundSetupPage />}
        />
        <Route
          path="/tournament/:id/round/:roundIndex/matrix"
          element={<MatrixEntryPage />}
        />
        <Route
          path="/tournament/:id/round/:roundIndex/pairing/:phase"
          element={<PairingPhasePage />}
        />
        <Route
          path="/tournament/:id/round/:roundIndex/summary"
          element={<RoundSummaryPage />}
        />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Tournament tab (redirects to active or list) */}
        <Route path="/tournament" element={<TournamentSummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
