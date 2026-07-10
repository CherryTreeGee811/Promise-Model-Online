using Microsoft.AspNetCore.Mvc.Filters;
using PromiseModelOnline.Api.Services;
using System.Collections;
using System.Text.RegularExpressions;

namespace PromiseModelOnline.Api.Filters;

/// <summary>Sanitizes all string properties on action arguments before the controller executes.</summary>
/// <remarks>
///   Runs after model binding but before the action method. Recursively walks all
///   properties of the bound model and sanitizes every string value through
///   <see cref="HtmlInputSanitizer.Sanitize"/>.
/// </remarks>
/// <summary>
/// Sanitizes all string properties on bound action arguments before the controller executes.
/// Uses <see cref="HtmlInputSanitizer"/> to strip HTML tags, preventing stored XSS.
/// </summary>
/// <param name="sanitizer">The HTML sanitizer service.</param>
public partial class InputSanitizationFilter(IHtmlInputSanitizer sanitizer) : IAsyncActionFilter
{
    private static readonly Regex IsJson = IsJsonRegex();

    [GeneratedRegex(@"^\s*[{[]", RegexOptions.Compiled)]
    private static partial Regex IsJsonRegex();

    /// <inheritdoc />
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var arg in context.ActionArguments.Values)
        {
            if (arg is string str)
            {
                // Direct string argument — sanitize inline
                var key = context.ActionArguments.First(kvp => kvp.Value == arg).Key;
                context.ActionArguments[key] = SanitizeString(str);
            }
            else if (arg is not null)
            {
                SanitizeObject(arg);
            }
        }

        await next();
    }

    /// <summary>Recursively sanitize all string properties on an object graph.</summary>
    private void SanitizeObject(object obj)
    {
        if (obj is null) return;
        var type = obj.GetType();

        // Skip primitive types and system types
        if (type.IsPrimitive || type == typeof(decimal) || type == typeof(DateTime) || type == typeof(Guid))
            return;

        // Skip enums
        if (type.IsEnum) return;

        // Handle collections
        if (obj is IEnumerable enumerable and not string)
        {
            foreach (var item in enumerable)
            {
                if (item is not null)
                    SanitizeObject(item);
            }
            return;
        }

        // Walk all writable string properties
        foreach (var prop in type.GetProperties(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public))
        {
            if (prop.PropertyType == typeof(string) && prop.CanRead && prop.CanWrite)
            {
                var value = prop.GetValue(obj) as string;
                if (!string.IsNullOrEmpty(value))
                {
                    prop.SetValue(obj, SanitizeString(value));
                }
            }
            else if (prop.PropertyType.IsClass && prop.PropertyType != typeof(string) && prop.CanRead)
            {
                var nested = prop.GetValue(obj);
                if (nested is not null)
                    SanitizeObject(nested);
            }
        }
    }

    /// <summary>Sanitize a single string value through the HTML sanitizer.</summary>
    private string SanitizeString(string value)
    {
        // Skip values that look like serialized JSON (import/export blobs)
        if (IsJson.IsMatch(value))
            return value;

        return sanitizer.Sanitize(value);
    }
}
