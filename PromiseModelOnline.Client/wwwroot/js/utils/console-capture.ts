const MAX_ENTRIES = 200;
const buffer: Array<{ level: string; timestamp: string; text: string }> = [];
let initialized = false;

function formatArg(arg: unknown): string {
    if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`;
    try {
        if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
    } catch {
        return String(arg);
    }
    return String(arg);
}

function capture(level: string, args: unknown[]): void {
    const timestamp = new Date().toISOString().slice(11, 23);
    const text = args.map(formatArg).join(' ');
    buffer.push({ level, timestamp, text });
    if (buffer.length > MAX_ENTRIES) buffer.shift();
}

export function initConsoleCapture(): void {
    if (initialized) return;
    initialized = true;

    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);
    const origInfo = console.info.bind(console);
    const origDebug = console.debug.bind(console);

    console.log = (...args: unknown[]) => { capture('log', args); origLog(...args); };
    console.warn = (...args: unknown[]) => { capture('warn', args); origWarn(...args); };
    console.error = (...args: unknown[]) => { capture('error', args); origError(...args); };
    console.info = (...args: unknown[]) => { capture('info', args); origInfo(...args); };
    console.debug = (...args: unknown[]) => { capture('debug', args); origDebug(...args); };
}

export function getFormattedConsoleLogs(): string {
    return buffer.map(e => `[${e.timestamp}] [${e.level}] ${e.text}`).join('\n');
}

export function clearConsoleLogs(): void {
    buffer.length = 0;
}
