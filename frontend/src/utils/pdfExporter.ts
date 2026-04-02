
import { jsPDF } from 'jspdf';
import { Itinerary, ActivityType } from '../types';

// Consolidating icons here to ensure they are part of the lazy-loaded chunk
const activityIcons: Record<string, string> = {
    'Food & Drink': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIjSURBVHhe7ZxLy4JBGMXfU4wF2cW4g5t3YBc3IPQJ3I3egXgCeQWhI4bFBzcgeQWhQ0EcFrd3d8ZuYGNxIYPz/+BBMGDS9FRP1VXV1A8O/VNV1T/V1AdtGKaUkvY5XyVwStI8o6dJmsv58oBfSnKPlzQk+0uSt/L5WUAzSmmpn5O0yflkQDPJW0n/JOnbJH/K+WpAM0pJJR9L+pGs85sBzSX5S9Jnkn6T5GNJ38nlZgHNKCWV/CDp7SS/S/qt/G5AM0n+kvSfpPck/TrJ38vlYgHNKCXt/SR9nOT/k/xY/jcDmkny/yX9L8kvyh9L+l4ubxagGaWk/SPp/yT/kPwb+V0NzST5v6T/Jflf5Q8lfS+Xtwswk5RU8nGSf0nyV+Xvbmjms/z/kv4tyT/K/5WkLyf4SwGzmJJy5P/K3yZpMkn/Kfl/5X8raR0/8JmMf8nfL/n/5J+U/K/1f4t/uV/y18q/GzDTlJT/K/92/u/8HwzYZJJ+Sv5v+V/k/5T8v4T/SyCmKSl/Kf+7+X/nf2/APkl+V/K/y/8t/6cE/5T/E4iZpKQk/y/5v+X/lv8jgJkk/z/5v+X/lf8b/luSfpZgYQGziFIS/8/8P/L/yP8lgJkk/y/5f8v/Lf+nBP8k+WMBMwlRSuK/mX+S/Cv5/xOAmSQfSP5f+W/5v+X/L8EvS/C/AWYSoZQkf5P8a/l/E8BMku8l/2/5f8v/W/5P8v8WwMwSFOW/k38j/18CMIkk/y3/b/l/yz8p+T/F7wkwhwRlacW/3cE/I+BPIj/8v/V/7+9/fwG/Pzr/d/7v/L8B/A75X/K/5X+W/wuAX/K/5f+W/5v+SwD/K/9v+X/L/1v+TwD+X/7f8v+W/7f8XwD8lf+/5P8t/7f8XwL8kvyv/L8A/H75v+V/BOCv5f8l/0sA/lf+7/z/+T8B+E/5f8v/SgD/K/8v+X8B+E/5fwtgJiGKaSnJPyv/Z/7v/N8BMIkk/6/8n/l/E8BMkv8b/i8BMwlRSkn/Lf+XAFzJV/gP+X/K/0sAM0ny/5b/W/7PCf5J8scCZhKhFBX53/l/5X/n/0YAM0m+lPy/4//W//cE/5T/E4iZpKSkP5L/W/4vADIJyc/n/y/5Z+V/JWk9P/CZjH9K0pGkV5L8rfwfCZhJSkp5Nsm7kv4qyedJ3pfLaQWYSYpSUpKskzQlaTNJ/ibJp/N5WYA5paSS3JL0hSTfk/wjyY/z+VlAM0pJ/U/SbyT9nOT/lHyZ5L/L5WIBzSgldS/pP0n+Mcm/k/xZ0vfyuVlAM0pJpa8k/VCS9yf5f0r+TNJ38vlZQDNKSW1n+cAvJfmRpHnOX8n5bwl8ALcMhL4ZAAAAAElFTkSuQmCC',
    'Museum & Art': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAEKSURBVHhe7dsxDQAhDAXBi/yYFYsV2IIt2IIdcAX2YwEcCPk1L3c/JLwMSJIkSVK6l+A7gS/AX+G/AhOAx38GToC/whdAj//vgQvgq/BFwOP/O2AC+CrsAzz+/wZsgK/CHoDx/xtwAfwVdgGM//8BG+Cv8D7A4/834AL4K7wL8Pj/Deh2gN9CqgHkP2BGX2fA543GvR/AzK4z4H1G494PaLbzBvwegRj3B2B2t2fg/QrEuD8AM7vtDPifQIx7A7Dd/Tvg/wRizBmA2V1vwPu5xj0byO4+B97vNO7ZQHb3O+A9BmM+A9jsvgPez2jMOYLZ7X3g/ZzGnCOY3V4G3s9qzDmC2e0d4H2cxtwjmN2+B96P0phzA7DbvQe8n9OYe2D28zbwfk5j7oHZz9vA+zmNuQdmfz8Db8A0pkW2n5+BN2Ca0yJzzwZgmpMia8/PgBmmNaY4SZIkSZIkSXpCfwGq7zW0UqgHjgAAAABJRU5ErkJggg==',
    'Outdoor & Nature': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIBSURBVHhe7dtNKwRRFAbg/8zOztIqYpFYoLBAsLWIoGBhIVaxEAv2VvYGFgn2FinYWLSwkERiYxELG/8CGxvbWCBkX/9wTjKzuy+z2czOzswDHybJO3fmzMw3d5LdJEmSJEmS5GJZx13AFTAEjoAd0L8N2ArbwFnQC/Q5j2zC83AI9AGL4BHogV7g/3XwU6zDPdAOfAAvgD1wDRzCdVABPYCvYD9sB8+DPg5gpVj/Bfg4gL+K9e+BPg5gt6z5HXw8wG9Z8zvQxwFsx/P/4OMA/sPz/+fQxQHszfTvgY8D+DWzfxN6OID5Mv4n8HEAd2X8z6AHA5iR8Q+AiwP4KSN/BvQwgFkY+Rvg4gA2YuQvoAcBjMLIn4CLAJiMkf+CPgRgCSM/CxchMDkjPwoXITADMw8LlyEwg5kHC5chsJzZhwvXITDT2YcL16EwvbkHC9ehMMu5hwtXITDXuYcLlyIwm7sHC5ciMJd7DxYuQWAu9x4sXIbCXu8eLFyGwF7vHixchuBD7x0sXI7gQ+8dLFyO4HvvOSxcjuD77jkshoL/vucxWAzgfe85LAbD//6eZ7AYgO+9F2MxFvD/92IsZgO+9V6MxbD+Hy/GYou/fBdjMQrfexfGYlj/W92NY9gKfecujMUwfB/qYijGYih+9S6OxTB8HOLvXo3FMDwMYM6SJElyLq8B6m1MvG+1uLEAAAAASUVORK5CYII=',
    'Shopping': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIjSURBVHhe7ZxLy4JBGMXfU4wF2cW4g5t3YBc3IPQJ3I3egXgCeQWhI4bFBzcgeQWhQ0EcFrd3d8ZuYGNxIYPz/+BBMGDS9FRP1VXV1A8O/VNV1T/V1AdtGKaUkvY5XyVwStI8o6dJmsv58oBfSnKPlzQk+0uSt/L5WUAzSmmpn5O0yflkQDPJW0n/JOnbJH/K+WpAM0pJJR9L+pGs85sBzSX5S9Jnkn6T5GNJ38nlZgHNKCWV/CDp7SS/S/qt/G5AM0n+kvSfpPck/TrJ38vlYgHNKCXt/SR9nOT/k/xY/jcDmkny/yX9L8kvyh9L+l4ubxagGaWk/SPp/yT/kPwb+V0NzST5v6T/Jflf5Q8lfS+Xtwswk5RU8nGSf0nyV+Xvbmjms/z/kv4tyT/K/5WkLyf4SwGzmJJy5P/K3yZpMkn/Kfl/5X8raR0/8JmMf8nfL/n/5J+U/K/1f4t/uV/y18q/GzDTlJT/K/92/u/8HwzYZJJ+Sv5v+V/k/5T8v4T/SyCmKSl/Kf+7+X/nf2/APkl+V/K/y/8t/6cE/5T/E4iZpKQk/y/5v+X/lv8jgJkk/z/5v+X/lf8b/luSfpZgYQGziFIS/8/8P/L/yP8lgJkk/y/5f8v/Lf+nBP8k+WMBMwlRSuK/mX+S/Cv5/xOAmSQfSP5f+W/5v+X/L8EvS/C/AWYSoZQkf5P8a/l/E8BMku8l/2/5f8v/W/5P8v8WwMwSFOW/k38j/18CMIkk/y3/b/l/yz8p+T/F7wkwhwRlacW/3cE/I+BPIj/8v/V/7+9/fwG/Pzr/d/7v/L8B/A75X/K/5X+W/wuAX/K/5f+W/5v+SwD/K/9v+X/L/1v+TwD+X/7f8v+W/7f8XwD8lf+/5P8t/7f8XwL8kvyv/L8A/H75v+V/BOCv5f8l/0sA/lf+7/z/+T8B+E/5f8v/SgD/K/8v+X8B+E/5fwtgJiGKaSnJPyv/Z/7v/N8BMIkk/6/8n/l/E8BMkv8b/i8BMwlRSkn/Lf+XAFzJV/gP+X/K/0sAM0ny/5b/W/7PCf5J8scCZhKhFBX53/l/5X/n/0YAM0m+lPy/4//W//cE/5T/E4iZpKSkP5L/W/4vADIJyc/n/y/5Z+V/JWk9P/CZjH9K0pGkV5L8rfwfCZhJSkp5Nsm7kv4qyedJ3pfLaQWYSYpSUpKskzQlaTNJ/ibJp/N5WYA5paSS3JL0hSTfk/wjyY/z+VlAM0pJ/U/SbyT9nOT/lHyZ5L/L5WIBzSgldS/pP0n+Mcm/k/xZ0vfyuVlAM0pJpa8k/VCS9yf5f0r+TNJ38vlZQDNKSW1n+cAvJfmRpHnOX8n5bwl8ALcMhL4ZAAAAAElFTkSuQmCC',
    'Entertainment': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAB4SURBVHhe7csxCQAgEMDAAv9NJ/GgQYOkB4I7F6mFvctLAgAAAAAAAAAAAABsw3YEbMeAjf0Q0I4BG/shgAFsw5EBG/shgA+Y2A8BnYAR+yGgExixHwI6ASv2Q0An4A17IKATsKIdAjoBjxixBwI6AY9YwwYAAAAAAAAAAAAAvrkBOQIBvQ3HkHUAAAAASUVORK5CYII=',
    'Landmark': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAB5SURBVHhe7csxDQAgEBERyf+dJdACJVCASqgESvAG3s39XUkCAAAAAAAAAAAAAAAAAAB+2rYDsK0BG1tqQFsDNLbUgM0BGltqwKYALLaUgA0BWmxpAYsCLLWkBSwJsNSSGrAkwFJLKkCWACy1JAGkCGgpCQAAAAAAAAAAAAAAAAAAVK4BSvECzX9qg/QAAAAASUVORK5CYII=',
    'Other': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIXSURBVHhe7dpNa8JAFAbgs6wsbUFQBFtQ8BvEVxAFQXyE4gVEBRVfQPAFFBVUEUWQIBqiIInaQ1Izk5A2adIm/eD/ICR737vZdMllIUnbUFK6mP9GgNf8u0m6lXTG3wZ8T9KPSe6VdJ9b/LcA70g6/TMA/jK/DfgvSbdK+s+H+NsC3Jb0tKT/ZpLe8zcA7/i3gHckHSrpnpLu8v8fAnzH33/4j0g6JekZ/jYDb0h6S/K+pJOkL/l3AnxP0pGSNpO8Lenb/DsA3pD0l6TTJG8l/dofnwf4maQ3JP0uyWf5/T4A3pD0j6SbJW0lef2fPwC8IelrSf9M8v/1/b4Ab0h6Jsm3ki4l/dYf/wDwN/v6k6RXJU0lfcjffgC8IelmSScl/d0/XwJ4Q9Ink84l/dbfnwB4Q9L7kn6U9G/+8BfgDUn7S/p00of5498BeEPSn5O+lvTZ/PEf4A1Jz0u6Qvqh/PkvwJuS7pf0v6Sv549/Am9Iul/S15P+nD//Bbwl6WdJL0o6lfz5F+BNSb9IulHSx/PnT8D/S/pT0q+SHuXPn4DfknSTpLslbcl/zgL8h6QfJf096bH8cxbgZ5I2J/0r6Z38cybgX5P+kXSfpD/mX/8AfknS/0q6S9I38y9XgHckvS3pr0nv5l/NAHg7/3ZJLyddnr92BeD3JP0i6b78tSuAv5N0m6Tb89euAH5L0h+SDufXTgG8Len/SDqd3zoG8J6ky0mv5/s7A3hP0vOStuf3ewbwnqQ/JX0h3/sF4A1Jt0n6iXz/FYD/l3SbpH35/T4BvCHpb0m3yPf1B3hD0lHSbJLX5P+eALwh6StJZ0nelfQtf34M4A1Jf0z6TvL9/EEAb0g6S9JJks6SfuXPtwDemHX5I0lvkjyT//sTwBqS/p+0lSSH+fszwBqSTpN0iaTf5//+ALAGpP8n/S/pp3P/bwBrSFpM8keStvP/XgBrSOpLOkfyZ/P/twDWkLRd0qX8+SvA//q/hKQPSP7M/zcA3kjynKT/yZ/PB/CNJJ1Avp+fAfy/JP02/ykE4C9J/y95YgEAV/KnH/y7JG0l/cff3w3gt/0lSZK2oKT0wZ8W0F9vUf4Q4gAAAABJRU5ErkJggg=='
};

export const exportItineraryToPDF = async (itinerary: Itinerary) => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });

  const MARGIN = 72;
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  
  const COLORS = { 
    text: '#333333',
    heading: '#001f3f',
    subtitle: '#555555',
    lightGray: '#AAAAAA',
    line: '#DDDDDD'
  };
  
  let cursorY = MARGIN;

  const drawHeader = () => {
    doc.setFontSize(9);
    doc.setTextColor(COLORS.lightGray);
    doc.text('VoyageAI Itinerary', MARGIN, 40);
    doc.text(new Date().toLocaleDateString(), PAGE_WIDTH - MARGIN, 40, { align: 'right' });
    doc.setDrawColor(COLORS.line);
    doc.line(MARGIN, 50, PAGE_WIDTH - MARGIN, 50);
  };
  
  const drawFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(COLORS.lightGray);
      doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 40, { align: 'right' });
    }
  };
  
  const checkPageBreak = (spaceNeeded: number) => {
    if (cursorY + spaceNeeded > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
      drawHeader();
    }
  };
  
  drawHeader();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(COLORS.heading);
  const titleLines = doc.splitTextToSize(itinerary.tripTitle, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN, cursorY);
  cursorY += titleLines.length * 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.subtitle);
  doc.text(`${itinerary.duration}-Day Trip to ${itinerary.destination}`, MARGIN, cursorY);
  cursorY += 40;

  itinerary.dailyPlans.forEach(day => {
    checkPageBreak(100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLORS.heading);
    doc.text(`Day ${day.day}: ${day.title}`, MARGIN, cursorY);
    cursorY += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.text);
    const summaryLines = doc.splitTextToSize(day.summary, CONTENT_WIDTH);
    doc.text(summaryLines, MARGIN, cursorY, { lineHeightFactor: 1.4 });
    cursorY += summaryLines.length * 16 + 10;

    day.activities.forEach(activity => {
      checkPageBreak(40);
      const iconSize = 12;
      const activityText = `[${activity.time}] ${activity.name}: ${activity.description}`;
      const activityLines = doc.splitTextToSize(activityText, CONTENT_WIDTH - 20);
      
      const iconData = activityIcons[activity.activityType] || activityIcons['Other'];
      try {
        doc.addImage(iconData, 'PNG', MARGIN, cursorY - 10, iconSize, iconSize);
      } catch (e) {}

      doc.text(activityLines, MARGIN + 20, cursorY, { lineHeightFactor: 1.4 });
      cursorY += activityLines.length * 16 + 5;
    });
    cursorY += 20;
  });

  drawFooter();
  doc.save(`Itinerary-${itinerary.destination.replace(/\s+/g, '-')}.pdf`);
};
