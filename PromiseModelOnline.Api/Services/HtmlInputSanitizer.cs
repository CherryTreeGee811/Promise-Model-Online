using Ganss.Xss;

namespace PromiseModelOnline.Api.Services;

/// <summary>Strips all HTML tags from string inputs to prevent stored XSS.</summary>
/// <remarks>
///   This application does not support rich text — all statements, descriptions, and
///   comments are plain text. The sanitizer removes every HTML tag, CSS property, and
///   URL scheme to ensure only clean text is stored.
/// </remarks>
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
    /// <param name="input">The raw user input, potentially containing HTML.</param>
    /// <returns>Clean plain text with all HTML removed.</returns>
    public string Sanitize(string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        var result = _sanitizer.Sanitize(input);

        // The HtmlSanitizer preserves non-HTML text content
        // (it strips tags but keeps the text between them)
        return result;
    }
}
