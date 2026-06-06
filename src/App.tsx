import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shipyard from "@/pages/Shipyard";
import Crew from "@/pages/Crew";
import Voyage from "@/pages/Voyage";
import Battle from "@/pages/Battle";
import Market from "@/pages/Market";
import Logbook from "@/pages/Logbook";
import Leaderboard from "@/pages/Leaderboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shipyard" element={<Shipyard />} />
          <Route path="/crew" element={<Crew />} />
          <Route path="/voyage" element={<Voyage />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/market" element={<Market />} />
          <Route path="/logbook" element={<Logbook />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
