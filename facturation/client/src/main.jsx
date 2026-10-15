import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { loadFonts } from './lib/fonts.js';

loadFonts();

createRoot(document.getElementById('root')).render(<App />);
