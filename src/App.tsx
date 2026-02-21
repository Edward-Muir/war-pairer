import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';

// Implemented pages
import { HomePage } from '@/pages/HomePage';
import { TeamSetupPage } from '@/pages/TeamSetupPage';
import { GameSetupPage } from '@/pages/GameSetupPage';
import { MatrixEntryPage } from '@/pages/MatrixEntryPage';
import { PairingPhasePage } from '@/pages/PairingPhasePage';
import { GameSummaryPage } from '@/pages/GameSummaryPage';

// Placeholder pages - will be implemented in later phases
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

        {/* Game flow */}
        <Route path="/game/new" element={<GameSetupPage />} />
        <Route path="/game/:id/matrix" element={<MatrixEntryPage />} />
        <Route
          path="/game/:id/pairing/:phase"
          element={<PairingPhasePage />}
        />
        <Route path="/game/:id/summary" element={<GameSummaryPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
