public static class ConnectionStringExtensions
{
    public static string ResolveSecrets(this string connectionString)
    {
        if (!connectionString.Contains("Password_FILE="))
            return connectionString;

        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList();

        for (int i = 0; i < parts.Count; i++)
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