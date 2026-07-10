namespace PromiseModelOnline.Auth.Services;

/// <summary>Defines the contract for HTML input sanitization.</summary>
public interface IHtmlInputSanitizer
{
    /// <summary>Strip all HTML tags and attributes from the input string.</summary>
    string Sanitize(string input);
}
