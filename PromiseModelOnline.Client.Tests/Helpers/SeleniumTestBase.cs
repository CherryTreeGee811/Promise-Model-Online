using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using System;
using System.Net.Http;
using System.Threading;
using System.Diagnostics;
using System.IO;

namespace PromiseModelOnline.Client.Tests.Helpers
{
    public abstract class SeleniumTestBase
    {
        protected IWebDriver Driver = null!;
        protected WebDriverWait Wait = null!;
        protected string BaseUrl => Environment.GetEnvironmentVariable("TEST_BASE_URL") ?? "https://localhost:9000";
        protected string ApiBase => Environment.GetEnvironmentVariable("TEST_API_BASE_URL") ?? "https://localhost:8010";
        protected bool IsHeadless => string.Equals(Environment.GetEnvironmentVariable("HEADLESS") ?? "true", "true", StringComparison.OrdinalIgnoreCase);

        [SetUp]
        public void Setup()
        {
            var tempProfile = Path.Combine(Path.GetTempPath(), "chrome-test-profile-" + Guid.NewGuid());
            Directory.CreateDirectory(tempProfile);

            var options = new ChromeOptions();
            try { options.SetLoggingPreference(LogType.Browser, LogLevel.All); } catch { }

            if (IsHeadless)
                options.AddArgument("--headless=new");

            options.AddArgument("--disable-web-security");
            options.AddArgument("--allow-running-insecure-content");
            options.AddArgument("--no-sandbox");
            options.AddArgument("--disable-dev-shm-usage");
            options.AddArgument("--ignore-certificate-errors");
            options.AddArgument("--disable-features=OutOfBlinkCors");
            options.AddArgument($"--user-data-dir={tempProfile}");
            options.AddArgument("--window-size=1366,900");
            options.AcceptInsecureCertificates = true;

            Driver = new ChromeDriver(options);
            Driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(2);
            Driver.Manage().Timeouts().PageLoad = TimeSpan.FromSeconds(30);
            Wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(30));

            WaitForAppReady(30);
        }

        [TearDown]
        public void Teardown()
        {
            if (TestContext.CurrentContext.Result.Outcome.Status == NUnit.Framework.Interfaces.TestStatus.Failed)
                DumpDebugInfo();

            try
            {
                Driver.Quit();
                Driver.Dispose();
            }
            catch { }
        }

        /*
        ====================================
        AUTH
        ====================================
        */

        protected void EnsureLoggedIn(string targetPath = "/")
        {
            WaitForAppReady();

            var user = Environment.GetEnvironmentVariable("TEST_USER") ?? "testuser";
            var pass = Environment.GetEnvironmentVariable("TEST_PASSWORD") ?? "P@ssw0rd!";

            LoginViaUi(user, pass);

            NavigateSpaAndWait(targetPath);
        }

        protected void LoginViaUi(string username, string password, int timeoutSeconds = 20)
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            var userEl = WaitForElement(By.Id("username-input"), timeoutSeconds);
            var passEl = WaitForElement(By.Id("password-input"), timeoutSeconds);

            userEl.Clear();
            userEl.SendKeys(username);

            passEl.Clear();
            passEl.SendKeys(password);

            ScrollToAndClick(By.Id("login-btn"));

            var sw = Stopwatch.StartNew();
            while (sw.Elapsed.TotalSeconds < timeoutSeconds)
            {
                if (!Driver.Url.Contains("/login"))
                    return;

                Thread.Sleep(300);
            }

            var url = Driver.Url;
            var pageSource = GetPageSourcePreview();
            throw new Exception($"Login did not redirect away from /login within {timeoutSeconds}s. URL: {url}. Page preview: {pageSource}");
        }

        /*
        ====================================
        AUTH TOKEN STUBBING
        ====================================
        */

        protected void SetTokenStub(string token = "owner-token-fixed")
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/");
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                $"sessionStorage.setItem('pmo.accessToken', '{token}');");
        }

        protected void NavigateAsUser(string path, string token = "owner-token-fixed")
        {
            SetTokenStub(token);
            Driver.Navigate().GoToUrl(BaseUrl + path);
        }

        /*
        ====================================
        COMPATIBILITY HELPERS
        ====================================
        */

        protected void ScrollElementIntoViewAndClick(By by, int timeoutSeconds = 10)
        {
            ScrollToAndClick(by, timeoutSeconds);
        }

        protected void SetAuthCookie(string token, string cookieName = "accessToken")
        {
            var user = Environment.GetEnvironmentVariable("TEST_USER") ?? "testuser";
            var pass = Environment.GetEnvironmentVariable("TEST_PASSWORD") ?? "P@ssw0rd!";

            LoginViaUi(user, pass);
        }

        /*
        ====================================
        ELEMENT HELPERS
        ====================================
        */

        protected IWebElement WaitForElement(By by, int timeoutSeconds = 20)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));

            try
            {
                return wait.Until(d =>
                {
                    try
                    {
                        var el = d.FindElement(by);
                        return (el != null && el.Displayed) ? el : null;
                    }
                    catch
                    {
                        return null;
                    }
                });
            }
            catch (WebDriverTimeoutException)
            {
                DumpDebugInfo();
                throw;
            }
        }

        protected void ScrollToAndClick(By by, int timeoutSeconds = 10)
        {
            var element = WaitForElement(by, timeoutSeconds);

            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "arguments[0].scrollIntoView({block: 'center', inline: 'center'}); arguments[0].click();",
                element);
        }

        protected bool WaitUntil(Func<IWebDriver, bool> predicate, int timeoutSeconds = 10)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));

            try
            {
                return wait.Until(d =>
                {
                    try { return predicate(d); } catch { return false; }
                });
            }
            catch (WebDriverTimeoutException)
            {
                DumpDebugInfo();
                throw;
            }
        }

        protected IWebElement WaitForClickable(By by, int timeoutSeconds = 10)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));

            try
            {
                return wait.Until(d =>
                {
                    try
                    {
                        var el = d.FindElement(by);
                        return (el != null && el.Displayed && el.Enabled) ? el : null;
                    }
                    catch
                    {
                        return null;
                    }
                });
            }
            catch (WebDriverTimeoutException)
            {
                DumpDebugInfo();
                throw;
            }
        }

        /*
        ====================================
        SPA NAVIGATION
        ====================================
        */

        protected void NavigateSpa(string path)
        {
            ((IJavaScriptExecutor)Driver).ExecuteScript(@"
                window.history.pushState({}, '', arguments[0]);
                window.dispatchEvent(new PopStateEvent('popstate'));
            ", path);
        }

        protected void NavigateSpaAndWait(string path, int waitMs = 500)
        {
            NavigateSpa(path);
            Thread.Sleep(waitMs);
        }

        /*
        ====================================
        NAVIGATION HELPERS (DRY)
        ====================================
        */

        protected void ClickNavLink(string linkId)
        {
            ScrollToAndClick(By.Id(linkId));
        }

        protected void WaitForUrlContains(string expected, int timeoutSeconds = 10)
        {
            WaitUntil(d => d.Url.Contains(expected), timeoutSeconds);
        }

        /*
        ====================================
        DEBUG HELPERS
        ====================================
        */

        private string GetPageSourcePreview(int maxChars = 2000)
        {
            try
            {
                var src = Driver.PageSource ?? "";
                return src.Length > maxChars ? src.Substring(0, maxChars) : src;
            }
            catch
            {
                return "(failed to retrieve page source)";
            }
        }

        private void DumpDebugInfo()
        {
            try
            {
                var src = Driver.PageSource ?? "(no page source)";
                TestContext.Progress.WriteLine("----- PAGE SOURCE (truncated 10000 chars) -----");
                TestContext.Progress.WriteLine(src.Length > 10000 ? src.Substring(0, 10000) : src);

                try
                {
                    var logs = Driver.Manage().Logs.GetLog(LogType.Browser);
                    TestContext.Progress.WriteLine("----- BROWSER LOGS -----");

                    foreach (var l in logs)
                        TestContext.Progress.WriteLine(l.ToString());
                }
                catch
                {
                    TestContext.Progress.WriteLine("(failed to read browser logs)");
                }
            }
            catch (Exception e)
            {
                TestContext.Progress.WriteLine($"(failed diagnostics: {e.Message})");
            }
        }

        /*
        ====================================
        INFRASTRUCTURE
        ====================================
        */

        private void WaitForAppReady(int timeoutSeconds = 30)
        {
            var sw = Stopwatch.StartNew();

            WaitForEndpoint(BaseUrl + "/health", "Client app", timeoutSeconds, sw);
            WaitForEndpoint(ApiBase + "/health", "Gateway (WireMock)", timeoutSeconds, sw);
        }

        private void WaitForEndpoint(string url, string label, int overallTimeoutSeconds, Stopwatch sw)
        {
            var remaining = overallTimeoutSeconds - (int)sw.Elapsed.TotalSeconds;
            if (remaining <= 0)
                throw new Exception($"{label} at {url} not ready within {overallTimeoutSeconds}s.");

            var handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback = (_, _, _, _) => true;

            using var client = new HttpClient(handler);
            var deadline = DateTime.UtcNow.AddSeconds(remaining);

            while (DateTime.UtcNow < deadline)
            {
                try
                {
                    var resp = client.GetAsync(url).GetAwaiter().GetResult();
                    if (resp.IsSuccessStatusCode)
                        return;
                }
                catch { }

                Thread.Sleep(500);
            }

            throw new Exception($"{label} at {url} did not become healthy within {overallTimeoutSeconds}s.");
        }
    }
}