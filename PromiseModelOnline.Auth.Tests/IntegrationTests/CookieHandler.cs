using System.Net;

namespace PromiseModelOnline.Auth.Tests.IntegrationTests;

public class CookieHandler : DelegatingHandler
{
    public CookieContainer CookieContainer { get; } = new();

    public CookieHandler(HttpMessageHandler innerHandler) : base(innerHandler) { }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var uri = request.RequestUri ?? new Uri("http://localhost");

        if (!request.Headers.Contains("Cookie"))
        {
            var cookieHeader = CookieContainer.GetCookieHeader(uri);
            if (!string.IsNullOrEmpty(cookieHeader))
                request.Headers.Add("Cookie", cookieHeader);
        }

        var response = await base.SendAsync(request, cancellationToken);

        if (response.Headers.TryGetValues("Set-Cookie", out var cookies))
        {
            foreach (var cookie in cookies)
                CookieContainer.SetCookies(uri, cookie);
        }

        return response;
    }
}
