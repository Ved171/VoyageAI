
import { jsPDF } from 'jspdf';

export const exportProjectGuide = () => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  const MARGIN = 40;
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const COLORS = {
    primary: '#0d9488',
    dark: '#0f172a',
    text: '#334155',
    light: '#64748b'
  };

  let cursorY = 50;

  const addText = (text: string, size: number, color: string, isBold: boolean = false, space: number = 20) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, PAGE_WIDTH - MARGIN * 2);
    doc.text(lines, MARGIN, cursorY);
    cursorY += (lines.length * (size * 1.2)) + space;
  };

  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, PAGE_WIDTH, 5, 'F');
  
  addText('Project Documentation: Voyage - Smart Itinerary Planner', 22, COLORS.dark, true, 10);
  addText('Technical Breakdown & Resume Support', 12, COLORS.primary, false, 30);

  addText('Resume Highlights', 16, COLORS.dark, true, 10);
  const points = [
    'Developed a smart travel planning application using React and TypeScript, leveraging structured JSON schemas to generate customized itineraries with strict type safety.',
    'Implemented progressive data streaming to render partial content in real-time, significantly reducing perceived latency and enhancing user experience.',
    'Integrated interactive mapping via Leaflet and document generation with jsPDF to provide dynamic activity visualization and downloadable travel guides.',
    'Designed a responsive, high-performance UI with Tailwind CSS, featuring skeleton loading states and modern aesthetic principles.'
  ];
  points.forEach(p => addText('• ' + p, 10, COLORS.text, false, 5));
  cursorY += 15;

  addText('Technical Stack', 16, COLORS.dark, true, 10);
  addText('Frontend: React 19, TypeScript, Tailwind CSS', 10, COLORS.text, false, 2);
  addText('AI Integration: Google Gemini API (gemini-3-flash-preview)', 10, COLORS.text, false, 2);
  addText('Mapping: Leaflet.js (OpenStreetMap)', 10, COLORS.text, false, 2);
  addText('Document Engine: jsPDF', 10, COLORS.text, false, 2);
  cursorY += 15;

  addText('System Workflow & Architecture', 16, COLORS.dark, true, 10);
  addText('1. User Input Handling: Captures origin, destination, duration, and interests via a controlled React form.', 10, COLORS.text, false, 5);
  addText('2. Dual-Stage Generation: The system splits AI calls into two stages to minimize perceived latency.', 10, COLORS.text, false, 5);
  addText('3. State Hydration: Uses Async Generators to yield partial state updates to the UI.', 10, COLORS.text, false, 5);
  addText('4. Geographic Rendering: Maps activity coordinates to interactive markers with Leaflet.', 10, COLORS.text, false, 15);

  doc.save('Voyage-Project-Workflow.pdf');
};
