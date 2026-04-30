using System.Text;
using Microsoft.EntityFrameworkCore;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Extensions;

public static class PromiseHierarchySeeder
{
    private const string SeedOwnerEmail = "seed.promise-model-online@local";
    private const string SeedOwnerName = "Promise Model Online Seed User";
    private const string SeedOwnerPasswordHash = "seed-not-for-login";
    private const string TargetProjectName = "Promise Model Online";

    public static async Task SeedAsync(PromiseModelOnlineContext db, string contentRootPath, ILogger logger)
    {
        var owner = await EnsureSeedOwnerAsync(db);
        var project = await EnsureProjectAsync(db, owner.Id);

        var pmoPmDir = ResolvePmoPmDirectory(contentRootPath);

        var productRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Products.csv"));
        var epicRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Epics.csv"));
        var journeyRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Journeys.csv"));
        var flowRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Flows.csv"));
        var momentRows = ReadCsvRows(Path.Combine(pmoPmDir, "LinuxMarksmen-Promise_Model_Tracker-Moments.csv"));

        var productLookup = await SeedProductsAsync(db, project.Id, productRows);
        var epicLookup = await SeedEpicsAsync(db, epicRows, productLookup);
        var journeyLookup = await SeedJourneysAsync(db, journeyRows, epicLookup);
        var flowLookup = await SeedFlowsAsync(db, flowRows, journeyLookup);
        var summary = await SeedMomentsAsync(db, momentRows, flowLookup);

        logger?.LogInformation(
            "Promise hierarchy seed complete. ProjectId: {ProjectId}, Products: {ProductsInserted}/{ProductsTotal}, Epics: {EpicsInserted}/{EpicsTotal}, Journeys: {JourneysInserted}/{JourneysTotal}, Flows: {FlowsInserted}/{FlowsTotal}, Moments: {MomentsInserted}/{MomentsTotal}",
            project.Id,
            productLookup.Inserted,
            productLookup.Total,
            epicLookup.Inserted,
            epicLookup.Total,
            journeyLookup.Inserted,
            journeyLookup.Total,
            flowLookup.Inserted,
            flowLookup.Total,
            summary.Inserted,
            summary.Total
        );
    }

    private static async Task<User> EnsureSeedOwnerAsync(PromiseModelOnlineContext db)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == SeedOwnerEmail);
        if (existing != null)
        {
            return existing;
        }

        var owner = new User
        {
            Email = SeedOwnerEmail,
            Name = SeedOwnerName,
            PasswordHash = SeedOwnerPasswordHash,
            Role = UserRole.Professional,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(owner);
        await db.SaveChangesAsync();
        return owner;
    }

    private static async Task<Project> EnsureProjectAsync(PromiseModelOnlineContext db, int ownerId)
    {
        var existing = await db.Projects.FirstOrDefaultAsync(p => p.Name == TargetProjectName);
        if (existing != null)
        {
            if (existing.OwnerId != ownerId)
            {
                existing.OwnerId = ownerId;
                await db.SaveChangesAsync();
            }

            return existing;
        }

        var project = new Project
        {
            Name = TargetProjectName,
            Description = "Seeded from Promise Model tracker CSV sheets.",
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };

        db.Projects.Add(project);
        await db.SaveChangesAsync();
        return project;
    }

    private static async Task<SeedLookup> SeedProductsAsync(PromiseModelOnlineContext db, int projectId, IReadOnlyList<Dictionary<string, string>> rows)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Product Promise ID")) && !string.IsNullOrWhiteSpace(GetValue(r, "Product Promise Statement")))
            .OrderBy(r => GetValue(r, "Product Promise ID"), StringComparer.Ordinal)
            .ToList();

        var existing = await db.Promises
            .Where(p => p.ProjectId == projectId)
            .ToListAsync();

        var existingByStatementAndOrder = existing
            .GroupBy(p => new StatementOrder(p.Statement, p.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < seededRows.Count; i++)
        {
            var row = seededRows[i];
            var sourceId = GetValue(row, "Product Promise ID");
            var statement = GetValue(row, "Product Promise Statement");
            var key = new StatementOrder(statement, i + 1);

            if (!existingByStatementAndOrder.TryGetValue(key, out var promise))
            {
                promise = new Promise
                {
                    Statement = statement,
                    ProjectId = projectId,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Promises.Add(promise);
                await db.SaveChangesAsync();
                inserted++;
                existingByStatementAndOrder[key] = promise;
            }

            idMap[sourceId] = promise.Id;
        }

        return new SeedLookup(idMap, inserted, seededRows.Count);
    }

    private static async Task<SeedLookup> SeedEpicsAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup products)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Epic Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Product ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Epic Promise Statement")))
            .OrderBy(r => GetValue(r, "Epic Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => products.IdBySourceId.ContainsKey(GetValue(r, "Parent Product ID")))
            .ToList();

        var productIds = products.IdBySourceId.Values.ToHashSet();

        var existing = await db.Epics
            .Where(e => productIds.Contains(e.ProductPromiseId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(e => new ParentStatement(e.ProductPromiseId, e.Statement, e.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var sourceId = GetValue(row, "Epic Promise ID");
            var parentSourceId = GetValue(row, "Parent Product ID");
            var statement = GetValue(row, "Epic Promise Statement");

            var productId = products.IdBySourceId[parentSourceId];
            var key = new ParentStatement(productId, statement, i + 1);

            if (!existingByParentAndStatement.TryGetValue(key, out var epic))
            {
                epic = new Epic
                {
                    ProductPromiseId = productId,
                    Statement = statement,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Epics.Add(epic);
                await db.SaveChangesAsync();
                inserted++;
                existingByParentAndStatement[key] = epic;
            }

            idMap[sourceId] = epic.Id;
        }

        return new SeedLookup(idMap, inserted, validRows.Count);
    }

    private static async Task<SeedLookup> SeedJourneysAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup epics)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Journey Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Epic ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Journey Promise Statement")))
            .OrderBy(r => GetValue(r, "Journey Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => epics.IdBySourceId.ContainsKey(GetValue(r, "Parent Epic ID")))
            .ToList();

        var epicIds = epics.IdBySourceId.Values.ToHashSet();

        var existing = await db.Journeys
            .Where(j => epicIds.Contains(j.EpicId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(j => new ParentStatement(j.EpicId, j.Statement, j.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var sourceId = GetValue(row, "Journey Promise ID");
            var parentSourceId = GetValue(row, "Parent Epic ID");
            var statement = GetValue(row, "Journey Promise Statement");

            var epicId = epics.IdBySourceId[parentSourceId];
            var key = new ParentStatement(epicId, statement, i + 1);

            if (!existingByParentAndStatement.TryGetValue(key, out var journey))
            {
                journey = new Journey
                {
                    EpicId = epicId,
                    Statement = statement,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Journeys.Add(journey);
                await db.SaveChangesAsync();
                inserted++;
                existingByParentAndStatement[key] = journey;
            }

            idMap[sourceId] = journey.Id;
        }

        return new SeedLookup(idMap, inserted, validRows.Count);
    }

    private static async Task<SeedLookup> SeedFlowsAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup journeys)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Flow Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Journey ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Flow Promise Statement")))
            .OrderBy(r => GetValue(r, "Flow Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => journeys.IdBySourceId.ContainsKey(GetValue(r, "Parent Journey ID")))
            .ToList();

        var journeyIds = journeys.IdBySourceId.Values.ToHashSet();

        var existing = await db.Flows
            .Where(f => journeyIds.Contains(f.JourneyId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(f => new ParentStatement(f.JourneyId, f.Statement, f.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;
        var idMap = new Dictionary<string, int>(StringComparer.Ordinal);

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var sourceId = GetValue(row, "Flow Promise ID");
            var parentSourceId = GetValue(row, "Parent Journey ID");
            var statement = GetValue(row, "Flow Promise Statement");

            var journeyId = journeys.IdBySourceId[parentSourceId];
            var key = new ParentStatement(journeyId, statement, i + 1);

            if (!existingByParentAndStatement.TryGetValue(key, out var flow))
            {
                flow = new Flow
                {
                    JourneyId = journeyId,
                    Statement = statement,
                    DisplayOrder = i + 1,
                    CreatedAt = DateTime.UtcNow
                };

                db.Flows.Add(flow);
                await db.SaveChangesAsync();
                inserted++;
                existingByParentAndStatement[key] = flow;
            }

            idMap[sourceId] = flow.Id;
        }

        return new SeedLookup(idMap, inserted, validRows.Count);
    }

    private static async Task<InsertSummary> SeedMomentsAsync(PromiseModelOnlineContext db, IReadOnlyList<Dictionary<string, string>> rows, SeedLookup flows)
    {
        var seededRows = rows
            .Where(r => !string.IsNullOrWhiteSpace(GetValue(r, "Moment Promise ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Parent Flow ID"))
                && !string.IsNullOrWhiteSpace(GetValue(r, "Moment Promise Statement")))
            .OrderBy(r => GetValue(r, "Moment Promise ID"), StringComparer.Ordinal)
            .ToList();

        var validRows = seededRows
            .Where(r => flows.IdBySourceId.ContainsKey(GetValue(r, "Parent Flow ID")))
            .ToList();

        var flowIds = flows.IdBySourceId.Values.ToHashSet();

        var existing = await db.Moments
            .Where(m => flowIds.Contains(m.FlowId))
            .ToListAsync();

        var existingByParentAndStatement = existing
            .GroupBy(m => new ParentStatement(m.FlowId, m.Statement, m.DisplayOrder))
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

        var inserted = 0;

        for (var i = 0; i < validRows.Count; i++)
        {
            var row = validRows[i];
            var parentSourceId = GetValue(row, "Parent Flow ID");
            var statement = GetValue(row, "Moment Promise Statement");
            var flowId = flows.IdBySourceId[parentSourceId];

            var key = new ParentStatement(flowId, statement, i + 1);
            if (existingByParentAndStatement.ContainsKey(key))
            {
                continue;
            }

            var moment = new Moment
            {
                FlowId = flowId,
                Statement = statement,
                Type = MomentType.Story,
                Status = MomentStatus.Todo,
                DisplayOrder = i + 1,
                CreatedAt = DateTime.UtcNow
            };

            db.Moments.Add(moment);
            await db.SaveChangesAsync();
            inserted++;
            existingByParentAndStatement[key] = moment;
        }

        return new InsertSummary(inserted, validRows.Count);
    }

    private static string ResolvePmoPmDirectory(string contentRootPath)
    {
        var direct = Path.Combine(contentRootPath, "pmo_pm");
        if (Directory.Exists(direct))
        {
            return direct;
        }

        var sibling = Path.Combine(contentRootPath, "..", "pmo_pm");
        if (Directory.Exists(sibling))
        {
            return Path.GetFullPath(sibling);
        }

        var current = new DirectoryInfo(contentRootPath);
        while (current != null)
        {
            var candidate = Path.Combine(current.FullName, "pmo_pm");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate pmo_pm directory containing Promise CSV files.");
    }

    private static List<Dictionary<string, string>> ReadCsvRows(string path)
    {
        if (!File.Exists(path))
        {
            throw new FileNotFoundException("Required seed CSV file is missing.", path);
        }

        var lines = File.ReadAllLines(path);
        if (lines.Length == 0)
        {
            return new List<Dictionary<string, string>>();
        }

        var headers = ParseCsvLine(lines[0]);
        var rows = new List<Dictionary<string, string>>();

        for (var i = 1; i < lines.Length; i++)
        {
            if (string.IsNullOrWhiteSpace(lines[i]))
            {
                continue;
            }

            var fields = ParseCsvLine(lines[i]);
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            for (var c = 0; c < headers.Count; c++)
            {
                var value = c < fields.Count ? fields[c] : string.Empty;
                row[headers[c]] = value;
            }

            rows.Add(row);
        }

        return rows;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var sb = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];
            if (ch == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (ch == ',' && !inQuotes)
            {
                values.Add(sb.ToString());
                sb.Clear();
                continue;
            }

            sb.Append(ch);
        }

        values.Add(sb.ToString());
        return values;
    }

    private static string GetValue(IReadOnlyDictionary<string, string> row, string key)
    {
        return row.TryGetValue(key, out var value) ? value : string.Empty;
    }

    private readonly record struct StatementOrder(string Statement, int DisplayOrder);

    private readonly record struct ParentStatement(int ParentId, string Statement, int DisplayOrder);

    private readonly record struct SeedLookup(Dictionary<string, int> IdBySourceId, int Inserted, int Total);

    private readonly record struct InsertSummary(int Inserted, int Total);

}
