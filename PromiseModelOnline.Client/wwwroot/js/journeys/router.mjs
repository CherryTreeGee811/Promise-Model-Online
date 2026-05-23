import { loadTemplate } from '../router.mjs';
import { loadJourneyDetail } from './detail.mjs';

export function handleJourneyRoutes(path, navContentDiv, contentDiv) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 2 && segments[0] === 'journeys') {
        const journeyId = segments[1];
        loadTemplate('journeys/detail.html', contentDiv)
            .then(() => loadJourneyDetail(journeyId, navContentDiv, contentDiv))
            .catch(err => {
                console.error('Error loading journey detail:', err);
                contentDiv.innerHTML = '<h1>Error loading journey</h1>';
            });
    } else {
        contentDiv.innerHTML = '<h1>404 Not Found</h1>';
    }
}