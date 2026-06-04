using Microsoft.Extensions.Configuration;

namespace Microsoft.Extensions.Configuration;

public static class SecretFileConfigurationExtensions
{
    /// <summary>
    /// Replaces configuration values that end with "_FILE" with the content of the file they point to.
    /// For example, "Password_FILE=/run/secrets/auth_db_password" will cause "Password" to return the file's content.
    /// </summary>
    public static IConfigurationBuilder AddSecretFileResolver(this IConfigurationBuilder builder)
    {
        return builder.Add(new SecretFileConfigurationSource());
    }

    private sealed class SecretFileConfigurationSource : IConfigurationSource
    {
        public IConfigurationProvider Build(IConfigurationBuilder builder)
            => new SecretFileConfigurationProvider();
    }

    private sealed class SecretFileConfigurationProvider : ConfigurationProvider
    {
        public override bool TryGet(string key, out string? value)
        {
            // Look for a key with "_FILE" suffix
            var fileKey = key + "_FILE";
            if (Data.TryGetValue(fileKey, out var filePath) && !string.IsNullOrWhiteSpace(filePath))
            {
                if (File.Exists(filePath))
                {
                    value = File.ReadAllText(filePath).Trim();
                    return true;
                }
            }

            return Data.TryGetValue(key, out value);
        }
    }
}