namespace PromiseModelOnline.Auth.Extensions;

/// <summary>Extension methods for resolving Docker secrets embedded in connection strings.</summary>
public static class ConnectionStringExtensions
{
    /// <summary>Replace <c>Password_FILE=</c> entries with the actual password read from the secret file.</summary>
    /// <param name="connectionString">The raw connection string, possibly containing <c>Password_FILE=</c>.</param>
    /// <returns>The resolved connection string with passwords inlined.</returns>
    /// <exception cref="InvalidOperationException">Secret file not found or empty.</exception>
    public static string ResolveSecrets(this string connectionString)
    {
        if (!connectionString.Contains("Password_FILE="))
            return connectionString;

        List<string> parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList();

        for (var i = 0; i < parts.Count; i++)
        {
            if (parts[i].StartsWith("Password_FILE="))
            {
                var filePath = parts[i].Substring("Password_FILE=".Length);

                if (!File.Exists(filePath))
                    throw new InvalidOperationException(
                        $"Secret file '{filePath}' not found. Mount a Docker secret at this path.");

                var password = File.ReadAllText(filePath).Trim();

                if (string.IsNullOrEmpty(password))
                    throw new InvalidOperationException(
                        $"Secret file '{filePath}' is empty. Populate it with a password.");

                parts[i] = $"Password={password}";
            }
        }

        return string.Join(';', parts);
    }
}
