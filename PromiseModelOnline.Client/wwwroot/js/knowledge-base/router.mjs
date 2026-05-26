import { loadTemplate } from '../router.mjs';
import { loadKnowledgeBase } from './detail.mjs';

export function handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv) {
    loadTemplate("knowledge-base.html", contentDiv)
        .then(() => loadKnowledgeBase())
        .catch(err => {
            console.error('Error loading knowledge base:', err);
            contentDiv.innerHTML = '<h1>Error loading knowledge base</h1>';
        });
}
