import { Routes, Route } from 'react-router-dom';
import ExpenditureMonthView from './ExpenditureMonthView';
import ExpenditureAll from './ExpenditureAll';
import Summary from './Summary';
import Sections from './Sections';
import Categories from './Categories';

export default function ExpenditureRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ExpenditureMonthView />} />
      <Route path="summary" element={<Summary />} />
      <Route path="all" element={<ExpenditureAll />} />
      
      {/* Legacy admin management routes - kept if needed */}
      <Route path="sections" element={<Sections />} />
      <Route path="sections/:id/categories" element={<Categories />} />
    </Routes>
  );
}
