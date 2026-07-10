import { vi } from 'vitest';

// Polyfill CSS.escape for jsdom (not available in jsdom)
(globalThis as Record<string, unknown>).CSS ??= { escape: (value: string) => value.replace(/[!"#$%&'()*+,.\/:;<=>?@[\]^`{|}~]/g, '\\$&') } as { escape: (value: string) => string };

// Polyfill scrollIntoView for jsdom (not available in jsdom)
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
    (Element.prototype as Record<string, unknown>).scrollIntoView = vi.fn();
}

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve('<div>mock</div>'),
    json: () => Promise.resolve({}),
}));

Object.defineProperty(globalThis, 'location', {
    value: { pathname: '/test', href: 'https://test.local/test', assign: vi.fn() },
    writable: true,
});

(globalThis as Record<string, unknown>).tippy = vi.fn().mockReturnValue({
    show: vi.fn(), hide: vi.fn(), destroy: vi.fn(), setProps: vi.fn(),
});
const mockHubConnection = {
    withUrl: function () { return this; },
    withAutomaticReconnect: function () { return this; },
    configureLogging: function () { return this; },
    build: function () { return this; },
    on: vi.fn(),
    onclose: vi.fn(),
    onreconnecting: vi.fn(),
    onreconnected: vi.fn(),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    state: 'Disconnected',
};
class MockHubConnectionBuilder {
    constructor() { return mockHubConnection; }
}
(globalThis as Record<string, unknown>).signalR = {
    HubConnectionBuilder: MockHubConnectionBuilder,
    LogLevel: { Warning: 2 },
};

vi.mock('../../PromiseModelOnline.Client/wwwroot/js/notifications/badge.ts', () => ({
    startNotificationPolling: vi.fn(), getUnreadNotificationsEventName: vi.fn(), updateNotificationBadge: vi.fn(),
}));

// Provide localStorage mock (jsdom requires --localstorage-file flag otherwise)
if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    (globalThis as Record<string, unknown>).localStorage = {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
        get length() { return store.size; },
        key: (index: number) => Array.from(store.keys())[index] ?? null,
    } as Storage;
}

// Prevent router module side effects during import by providing DOM containers
if (typeof document !== 'undefined') {
    const contentDiv = document.createElement('div');
    contentDiv.id = 'content';
    document.body.append(contentDiv);

    const mainMenu = document.createElement('ul');
    mainMenu.id = 'main-menu';
    document.body.append(mainMenu);

    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    document.body.append(mainContent);

    const pageTitle = document.createElement('title');
    pageTitle.id = 'page-title';
    pageTitle.textContent = 'Test - Promise Model Online';
    document.head.append(pageTitle);
}
