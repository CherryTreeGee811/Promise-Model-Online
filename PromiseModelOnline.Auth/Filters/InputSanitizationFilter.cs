using Microsoft.AspNetCore.Mvc.Filters;
using PromiseModelOnline.Auth.Attributes;
using PromiseModelOnline.Auth.Services;
using System.Collections;

namespace PromiseModelOnline.Auth.Filters;

/// <summary>
/// Sanitizes all string properties on bound action arguments before the controller executes.
/// Uses <see cref="HtmlInputSanitizer"/> to strip HTML tags, preventing stored XSS.
/// </summary>
/// <param name="sanitizer">The HTML sanitizer service.</param>
public class InputSanitizationFilter(IHtmlInputSanitizer sanitizer) : IAsyncActionFilter
{
    /// <inheritdoc />
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var arg in context.ActionArguments.Values)
        {
            if (arg is string str)
            {
                var key = context.ActionArguments.First(kvp => kvp.Value == arg).Key;
                context.ActionArguments[key] = sanitizer.Sanitize(str);
            }
            else if (arg is not null)
            {
                SanitizeObject(arg);
            }
        }

        await next();
    }

    private void SanitizeObject(object obj)
    {
        if (obj is null) return;
        var type = obj.GetType();

        if (type.IsPrimitive || type == typeof(decimal) || type == typeof(DateTime) || type == typeof(Guid))
            return;
        if (type.IsEnum) return;

        if (obj is IEnumerable enumerable and not string)
        {
            foreach (var item in enumerable)
            {
                if (item is not null)
                    SanitizeObject(item);
            }
            return;
        }

        foreach (var prop in type.GetProperties(System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public))
        {
            if (prop.GetCustomAttributes(typeof(DoNotSanitizeAttribute), false).Length > 0)
                continue;
            if (prop.PropertyType == typeof(string) && prop.CanRead && prop.CanWrite)
            {
                var value = prop.GetValue(obj) as string;
                if (!string.IsNullOrEmpty(value))
                {
                    prop.SetValue(obj, sanitizer.Sanitize(value));
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
}
