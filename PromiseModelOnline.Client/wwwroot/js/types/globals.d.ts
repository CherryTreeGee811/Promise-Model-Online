/* Global types for vendor scripts loaded via <script> tags */

/** Bootstrap UI framework instance loaded from the CDN script tag. */
declare const bootstrap: {
    Modal: { getOrCreateInstance: (element: HTMLElement) => { hide: () => void; show: () => void } };
    Popover: { getOrCreateInstance: (element: HTMLElement) => { hide: () => void; show: () => void; dispose: () => void } };
    ScrollSpy: { getOrCreateInstance: (element: HTMLElement) => { refresh: () => void } };
    Toast: { getOrCreateInstance: (element: HTMLElement) => { show: () => void; hide: () => void } };
};
/** SignalR real-time communication hub connection. */
declare const signalR: { HubConnectionBuilder: new () => { withUrl: (url: string) => { withAutomaticReconnect: (delays: number[]) => { configureLogging: (level: number) => { build: () => { start: () => Promise<void>; stop: () => Promise<void>; on: (event: string, handler: (...eventData: unknown[]) => void) => void; onreconnecting: (handler: () => void) => void; onreconnected: (handler: () => void) => void; onclose: (handler: () => void) => void; state: number; connection?: unknown } } } } }; };
/** D3 data visualization library instance. */
declare const d3: unknown;
/** Tippy.js tooltip library instance. */
declare const tippy: (reference: Element | DocumentFragment, options?: Record<string, unknown>) => { setProps: (properties: Record<string, unknown>) => void; setContent: (content: unknown) => void; show: () => void; hide: () => void; destroy: () => void };
