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
    public class SeleniumTestBase
    {
        protected IWebDriver Driver = null!;
        protected WebDriverWait Wait = null!;
        protected string BaseUrl => Environment.GetEnvironmentVariable("TEST_BASE_URL") ?? "https://localhost:9000";

        [SetUp]
        public void Setup()
        {
            var tempProfile = Path.Combine(Path.GetTempPath(), "chrome-test-profile-" + Guid.NewGuid());
            Directory.CreateDirectory(tempProfile);

            var options = new ChromeOptions();

            var headless = Environment.GetEnvironmentVariable("HEADLESS") ?? "true";
            if (headless == "true") options.AddArgument("--headless=new");

            options.AddArgument("--disable-web-security");
            options.AddArgument("--allow-running-insecure-content");
            options.AddArgument("--no-sandbox");
            options.AddArgument("--disable-dev-shm-usage");
            options.AddArgument("--ignore-certificate-errors");
            options.AddArgument($"--user-data-dir={tempProfile}");
            options.AddArgument("--window-size=1366,900");
            options.AcceptInsecureCertificates = true;

            Driver = new ChromeDriver(options);
            Driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(2);
            Wait = new WebDriverWait(Driver, TimeSpan.FromSeconds(30));

            WaitForAppReady(30);
        }

        [TearDown]
        public void Teardown()
        {
            try
            {
                Driver.Quit();
                Driver.Dispose();
            }
            catch { }
        }

        /// <summary>
        /// Navigate to a protected SPA route. The mock Auth server will supply a token automatically.
        /// </summary>
        protected void EnsureLoggedIn(string targetPath = "/")
        {
            NavigateSpa(targetPath);
        }

        /// <summary>
        /// Use pushState to change the SPA route without a full page load.
        /// </summary>
        protected void NavigateSpa(string path)
        {
            // First load the SPA's home page so the app initialises and obtains a token
            if (!Driver.Url.StartsWith(BaseUrl))
                Driver.Navigate().GoToUrl(BaseUrl);

            WaitForAppReady();

            // Now navigate client‑side
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "window.history.pushState({}, '', arguments[0]);" +
                "window.dispatchEvent(new PopStateEvent('popstate'));",
                path);
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
                    catch { return null; }
                });
            }
            catch (WebDriverTimeoutException) { DumpDebugInfo(); throw; }
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
                    catch { return null; }
                });
            }
            catch (WebDriverTimeoutException) { DumpDebugInfo(); throw; }
        }

        protected void ScrollToAndClick(By by, int timeoutSeconds = 10)
        {
            var element = WaitForElement(by, timeoutSeconds);
            ((IJavaScriptExecutor)Driver).ExecuteScript(
                "arguments[0].scrollIntoView({block: 'center', inline: 'center'});", element);
            element.Click();
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
            catch (WebDriverTimeoutException) { DumpDebugInfo(); throw; }
        }

        private void WaitForAppReady(int timeoutSeconds = 30)
        {
            var handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback = (_, _, _, _) => true;
            using var client = new HttpClient(handler) { BaseAddress = new Uri(BaseUrl) };
            var sw = Stopwatch.StartNew();
            while (sw.Elapsed.TotalSeconds < timeoutSeconds)
            {
                try
                {
                    var resp = client.GetAsync("/health").GetAwaiter().GetResult();
                    if (resp.IsSuccessStatusCode) return;
                }
                catch { }
                Thread.Sleep(500);
            }
            throw new Exception($"Application at {BaseUrl} did not respond on /health within {timeoutSeconds} seconds.");
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
                    foreach (var l in logs) TestContext.Progress.WriteLine(l.ToString());
                }
                catch { TestContext.Progress.WriteLine("(failed to read browser logs)"); }
            }
            catch (Exception e) { TestContext.Progress.WriteLine($"(failed diagnostics: {e.Message})"); }
        }
    }
}