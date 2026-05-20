using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using System;
using System.Net.Http;
using System.Threading;
using System.Diagnostics;

namespace PromiseModelOnline.Client.Tests.Helpers
{
    public class SeleniumTestBase
    {
        protected IWebDriver Driver = null!;
        protected WebDriverWait Wait = null!;
        protected string BaseUrl => Environment.GetEnvironmentVariable("TEST_BASE_URL") ?? "https://localhost:9000";
        protected virtual bool ShouldSetDefaultAuthCookie => true;

        [SetUp]
        public void Setup()
        {
            var tempProfile = Path.Combine(Path.GetTempPath(), "chrome-test-profile-" + Guid.NewGuid());
            Directory.CreateDirectory(tempProfile);

            var options = new ChromeOptions();
            var headless = Environment.GetEnvironmentVariable("HEADLESS") ?? "true";
            if (headless == "true") options.AddArgument("--headless=new");
            // Enable browser console logging for diagnostics
            try { options.SetLoggingPreference(OpenQA.Selenium.LogType.Browser, OpenQA.Selenium.LogLevel.All); } catch { }
            options.AddArgument("--disable-web-security");
            options.AddArgument("--allow-running-insecure-content");
            options.AddArgument("--no-sandbox");
            options.AddArgument("--disable-dev-shm-usage");
            options.AddArgument("--ignore-certificate-errors");
            options.AddArgument("--disable-features=OutOfBlinkCors");
            options.AddArgument($"--user-data-dir={tempProfile}");
            options.AddArgument("--window-size=1366,768");
            options.AcceptInsecureCertificates = true;

            Driver = new ChromeDriver(options);
            Driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(2);
            Wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(30));

            // Use external WireMock (docker-compose) bound to host port 8000 by default.

            // No runtime fetch injection — prefer docker-compose to serve client and proxy /api to mock server.

            // Wait for the client app to be healthy before running tests
            try { WaitForAppReady(30); } catch (Exception ex) { throw new Exception($"App not ready: {ex.Message}"); }

            if (ShouldSetDefaultAuthCookie)
            {
                var authCookie = Environment.GetEnvironmentVariable("TEST_AUTH_COOKIE") ?? "owner-token-fixed";
                if (!string.IsNullOrEmpty(authCookie))
                {
                    SetAuthCookie(authCookie);
                }
            }
        }

        [TearDown]
        public void Teardown()
        {
            try { Driver.Quit(); Driver.Dispose(); } catch { }
        }

        protected void EnsureLoggedIn(string targetPath = "/")
        {
            WaitForAppReady();

            var authCookie = Environment.GetEnvironmentVariable("TEST_AUTH_COOKIE") ?? "owner-token-fixed";
            if (!string.IsNullOrEmpty(authCookie))
            {
                SetAuthCookie(authCookie);
                Driver.Navigate().GoToUrl(BaseUrl + targetPath);
                return;
            }

            var user = Environment.GetEnvironmentVariable("TEST_USER");
            var pass = Environment.GetEnvironmentVariable("TEST_PASSWORD");
            if (!string.IsNullOrEmpty(user) && !string.IsNullOrEmpty(pass))
            {
                LoginViaUi(user, pass);
                Driver.Navigate().GoToUrl(BaseUrl + targetPath);
                return;
            }

            // No auth provided; proceed unauthenticated. WireMock should return permissions and data for tests.
            Driver.Navigate().GoToUrl(BaseUrl + targetPath);
        }

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
            catch (OpenQA.Selenium.WebDriverTimeoutException)
            {
                // Collect diagnostics: page source and browser console logs
                try
                {
                    var src = Driver.PageSource ?? "(no page source)";
                    TestContext.Progress.WriteLine("----- WaitForElement timed out: dumping page source (truncated 10000 chars) -----");
                    TestContext.Progress.WriteLine(src.Length > 10000 ? src.Substring(0, 10000) : src);

                    try
                    {
                        var logs = Driver.Manage().Logs.GetLog(OpenQA.Selenium.LogType.Browser);
                        TestContext.Progress.WriteLine("----- Browser console logs -----");
                        foreach (var l in logs) TestContext.Progress.WriteLine(l.ToString());
                    }
                    catch (Exception) { TestContext.Progress.WriteLine("(failed to read browser logs)"); }
                }
                catch (Exception e)
                {
                    TestContext.Progress.WriteLine($"(failed to collect diagnostics: {e.Message})");
                }

                throw;
            }
        }

        protected T WaitUntil<T>(Func<IWebDriver, T> condition, int timeoutSeconds = 10)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));
            try
            {
                return wait.Until(condition);
            }
            catch (OpenQA.Selenium.WebDriverTimeoutException)
            {
                try
                {
                    TestContext.Progress.WriteLine("----- WaitUntil<T> timed out: dumping page source (truncated 10000 chars) -----");
                    var src = Driver.PageSource ?? "(no page source)";
                    TestContext.Progress.WriteLine(src.Length > 10000 ? src.Substring(0, 10000) : src);
                }
                catch { }
                throw;
            }
        }

        protected bool WaitUntil(Func<IWebDriver, bool> predicate, int timeoutSeconds = 10)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));
            try
            {
                return wait.Until(d => {
                    try { return predicate(d); } catch { return false; }
                });
            }
            catch (OpenQA.Selenium.WebDriverTimeoutException)
            {
                try
                {
                    TestContext.Progress.WriteLine("----- WaitUntil<bool> timed out: dumping page source (truncated 10000 chars) -----");
                    var src = Driver.PageSource ?? "(no page source)";
                    TestContext.Progress.WriteLine(src.Length > 10000 ? src.Substring(0, 10000) : src);
                }
                catch { }
                throw;
            }
        }

        private void WaitForAppReady(int timeoutSeconds = 30)
        {
            var handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true;
            using var client = new HttpClient(handler) { BaseAddress = new Uri(BaseUrl) };

            var sw = Stopwatch.StartNew();
            while (sw.Elapsed.TotalSeconds < timeoutSeconds)
            {
                try
                {
                    var resp = client.GetAsync("/health").GetAwaiter().GetResult();
                    if (resp.IsSuccessStatusCode) return;
                }
                catch
                {
                    // ignore and retry
                }

                Thread.Sleep(500);
            }

            throw new Exception($"Application at {BaseUrl} did not respond with success on /health within {timeoutSeconds} seconds.");
        }

        protected void SetAuthCookie(string token, string cookieName = "accessToken")
        {
            if (string.IsNullOrEmpty(token)) return;
            Driver.Navigate().GoToUrl(BaseUrl + "/");
            var cookie = new Cookie(cookieName, token, "/", DateTime.Now.AddDays(1));
            try { Driver.Manage().Cookies.DeleteCookieNamed(cookieName); } catch { }
            Driver.Manage().Cookies.AddCookie(cookie);
            Driver.Navigate().Refresh();
        }

        protected void ScrollToAndClick(By by, int timeoutSeconds = 10)
        {
            // Wait for the element to be present and visible
            var element = WaitForElement(by, timeoutSeconds);

            // Scroll the element into the centre of the screen, clearing any fixed overlays
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
                element);

            // Give the browser a moment to settle (no hard Sleep – just a minimal implicit delay)
            // Then perform a real click – exactly what a user would do after scrolling.
            element.Click();
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

            // Scroll the login button into view and click it – avoids interception by the fixed footer
            ScrollToAndClick(By.Id("login-btn"));

            var sw = Stopwatch.StartNew();
            while (sw.Elapsed.TotalSeconds < timeoutSeconds)
            {
                try
                {
                    var cookie = Driver.Manage().Cookies.GetCookieNamed("accessToken");
                    if (cookie != null && !string.IsNullOrEmpty(cookie.Value)) return;
                }
                catch { }

                Thread.Sleep(500);
            }

            throw new Exception("Login via UI did not produce accessToken cookie within timeout.");
        }
    }
}
