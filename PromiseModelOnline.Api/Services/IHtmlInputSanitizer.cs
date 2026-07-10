namespace PromiseModelOnline.Api.Services;

/// <summary>Defines the contract for HTML input sanitization.</summary>
public interface IHtmlInputSanitizer
{
    /// <summary>Strip all HTML tags and attributes from the input string.</summary>
    /// <param name="input">The raw user input, potentially containing HTML.</param>
    /// <returns>Clean plain text with all HTML removed.</returns>
    string Sanitize(string input);
}
