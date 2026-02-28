import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UpdatePopup } from '@/components/Common';
import { useVersionCheck } from '@/hooks/useVersionCheck';

// Implemented pages
import { HomePage } from '@/pages/HomePage';
import { TeamSetupPage } from '@/pages/TeamSetupPage';
import { GameSetupPage } from '@/pages/GameSetupPage';
import { MatrixEntryPage } from '@/pages/MatrixEntryPage';
import { PairingPhasePage } from '@/pages/PairingPhasePage';
import { GameSummaryPage } from '@/pages/GameSummaryPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import { PairingsExplainedPage } from '@/pages/PairingsExplainedPage';

function App() {
  const { updateAvailable } = useVersionCheck();

  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Team management */}
        <Route path="/team/new" element={<TeamSetupPage />} />
        <Route path="/team/:id/edit" element={<TeamSetupPage />} />

        {/* Info pages */}
        <Route path="/pairings-explained" element={<PairingsExplainedPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />

        {/* Game flow */}
        <Route path="/game/new" element={<GameSetupPage />} />
        <Route path="/game/:id/matrix" element={<MatrixEntryPage />} />
        <Route path="/game/:id/pairing/:phase" element={<PairingPhasePage />} />
        <Route path="/game/:id/summary" element={<GameSummaryPage />} />
      </Routes>

      <UpdatePopup isVisible={updateAvailable} />
    </BrowserRouter>
  );
}

export default App;
