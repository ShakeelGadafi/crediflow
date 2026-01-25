import { Routes, Route } from 'react-router-dom';
import ExpenditureList from './ExpenditureList';
import Sections from './Sections';
import Categories from './Categories';
import Summary from './Summary';

export default function ExpenditureRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ExpenditureList />} />
      <Route path="sections" element={<Sections />} />
      <Route path="sections/:id/categories" element={<Categories />} />
      <Route path="summary" element={<Summary />} />
    </Routes>
  );
}
