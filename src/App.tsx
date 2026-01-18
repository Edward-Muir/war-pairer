import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';

// Placeholder pages - will be implemented in later phases
function HomePage() {
  return (
    <Layout title="UKTC Pairing">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Welcome</h2>
        <p className="text-gray-600">Home page - manage teams and tournaments</p>
      </div>
    </Layout>
  );
}

function TeamSetupPage() {
  return (
    <Layout title="Team Setup" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Team setup page placeholder</p>
      </div>
    </Layout>
  );
}

function TournamentSetupPage() {
  return (
    <Layout title="New Tournament" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Tournament setup page placeholder</p>
      </div>
    </Layout>
  );
}

function TournamentSummaryPage() {
  return (
    <Layout title="Tournament" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Tournament summary page placeholder</p>
      </div>
    </Layout>
  );
}

function RoundSetupPage() {
  return (
    <Layout title="Round Setup" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Round setup page placeholder</p>
      </div>
    </Layout>
  );
}

function MatrixEntryPage() {
  return (
    <Layout title="Enter Matrix" showBack onBack={() => window.history.back()}>
      <div className="p-4">
        <p className="text-gray-600">Matrix entry page placeholder</p>
      </div>
    </Layout>
  );
}

function PairingPhasePage() {
  return (
    <Layout
      title="Pairing"
      showBack
      onBack={() => window.history.back()}
      showNav={false}
      currentPhase="defender-1-select"
    >
      <div className="p-4">
        <p className="text-gray-600">Pairing phase page placeholder</p>
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
