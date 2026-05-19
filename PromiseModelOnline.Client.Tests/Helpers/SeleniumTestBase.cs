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

        [SetUp]
        public void Setup()
        {
            var options = new ChromeOptions();
            //var headless = Environment.GetEnvironmentVariable("HEADLESS") ?? "true";
            //if (headless == "true") options.AddArgument("--headless=new");
            options.AddArgument("--no-sandbox");
            options.AddArgument("--disable-dev-shm-usage");
            options.AddArgument("--ignore-certificate-errors");
            options.AcceptInsecureCertificates = true;

            Driver = new ChromeDriver(options);
            Driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(2);
            Wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(30));

            // Use external WireMock (docker-compose) bound to host port 8000 by default.

            // No runtime fetch injection — prefer docker-compose to serve client and proxy /api to mock server.

            // Wait for the client app to be healthy before running tests
            try { WaitForAppReady(30); } catch (Exception ex) { throw new Exception($"App not ready: {ex.Message}"); }

            var authCookie = Environment.GetEnvironmentVariable("TEST_AUTH_COOKIE");
            if (!string.IsNullOrEmpty(authCookie))
            {
                SetAuthCookie(authCookie);
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

            var authCookie = Environment.GetEnvironmentVariable("TEST_AUTH_COOKIE");
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

        protected void LoginViaUi(string username, string password, int timeoutSeconds = 20)
        {
            Driver.Navigate().GoToUrl(BaseUrl + "/login");

            var userEl = WaitForElement(By.Id("username-input"), timeoutSeconds);
            var passEl = WaitForElement(By.Id("password-input"), timeoutSeconds);
            var btn = WaitForElement(By.Id("login-btn"), timeoutSeconds);

            userEl.Clear();
            userEl.SendKeys(username);
            passEl.Clear();
            passEl.SendKeys(password);
            btn.Click();

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

        protected IWebElement WaitForElement(By by, int timeoutSeconds = 20)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));
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

        protected T WaitUntil<T>(Func<IWebDriver, T> condition, int timeoutSeconds = 10)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));
            return wait.Until(condition);
        }

        protected bool WaitUntil(Func<IWebDriver, bool> predicate, int timeoutSeconds = 10)
        {
            var wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(timeoutSeconds));
            return wait.Until(d => {
                try { return predicate(d); } catch { return false; }
            });
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
    }
}
