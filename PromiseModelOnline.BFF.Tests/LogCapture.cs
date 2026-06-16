using Microsoft.Extensions.Logging;

namespace PromiseModelOnline.BFF.Tests;

/// <summary>Captures log entries from the test server for assertions.</summary>
public class LogCapture : ILoggerProvider
{
    private readonly List<(LogLevel Level, string Message)> _logs = [];
    private readonly object _lock = new();

    public ILogger CreateLogger(string categoryName) =>
        new CaptureLogger(categoryName, _logs, _lock);

    public IReadOnlyList<(LogLevel Level, string Message)> Logs
    {
        get { lock (_lock) return _logs.ToList(); }
    }

    public void Dispose() { }

    private class CaptureLogger(string categoryName, List<(LogLevel, string)> logs, object lockObj) : ILogger
    {
        private readonly string _categoryName = categoryName;

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            lock (lockObj)
                logs.Add((logLevel, $"[{_categoryName}] {formatter(state, exception)}"));
        }
    }
}

internal static class LogCaptureExtensions
{
    public static void ShouldContainWarning(this LogCapture capture, string contains) =>
        Assert.That(capture.Logs.Any(l => l.Level == LogLevel.Warning && l.Message.Contains(contains)), Is.True,
            $"Expected a Warning log containing '{contains}'");

    public static void ShouldContainInformation(this LogCapture capture, string contains) =>
        Assert.That(capture.Logs.Any(l => l.Level == LogLevel.Information && l.Message.Contains(contains)), Is.True,
            $"Expected an Information log containing '{contains}'");
}
