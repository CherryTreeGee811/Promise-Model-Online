using Ganss.Xss;

namespace PromiseModelOnline.Auth.Services;

/// <summary>Strips all HTML tags from string inputs to prevent stored XSS.</summary>
public class HtmlInputSanitizer : IHtmlInputSanitizer
{
    private readonly HtmlSanitizer _sanitizer;

    /// <summary>Initializes the sanitizer with all tags, attributes, and CSS properties cleared.</summary>
    public HtmlInputSanitizer()
    {
        _sanitizer = new HtmlSanitizer();
        _sanitizer.AllowedTags.Clear();
        _sanitizer.AllowedAttributes.Clear();
        _sanitizer.AllowedCssProperties.Clear();
    }

    /// <summary>Strip all HTML tags and attributes from the input string.</summary>
    public string Sanitize(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;
        return _sanitizer.Sanitize(input);
    }
}
