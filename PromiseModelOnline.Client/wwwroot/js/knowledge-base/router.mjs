import { loadTemplate, loadTemplateWithError } from '../router.mjs';
import { loadKnowledgeBase } from './detail.mjs';

export function handleKnowledgeBaseRoutes(path, navContentDiv, contentDiv) {
    loadTemplate("knowledge-base.html", contentDiv)
        .then(() => loadKnowledgeBase())
        .catch(loadTemplateWithError(contentDiv, 'knowledge base'));
}
