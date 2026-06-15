using PromiseModelOnline.Api.Enums;
using System.Collections.Generic;
using System.Linq;

namespace PromiseModelOnline.Api.BusinessLogic
{
    /// <summary>Maps <see cref="MomentStatus"/> values to display colors and rolls up child status colors for hierarchy entities.</summary>
    /// <remarks>
    ///   Color mapping: Done = green, InProgress = orange, Blocked = black, Todo = red.
    ///   The <see cref="RollUp"/> method aggregates child statuses: all Done = Done, all Blocked = Blocked,
    ///   mixed = InProgress. Used by <see cref="IHierarchyStatusService"/>.
    /// </remarks>
    public static class StatusColorRules
    {
        /// <summary>Status color for "to do" / not started.</summary>
        public const string Todo = "red";
        /// <summary>Status color for "in progress".</summary>
        public const string InProgress = "orange";
        /// <summary>Status color for "blocked".</summary>
        public const string Blocked = "black";
        /// <summary>Status color for "done" / completed.</summary>
        public const string Done = "green";

        /// <summary>Map a <see cref="MomentStatus"/> to its display color.</summary>
        /// <param name="status">The moment status.</param>
        /// <returns>The corresponding color constant.</returns>
        public static string FromMomentStatus(MomentStatus status)
        {
            return status switch
            {
                MomentStatus.Done => Done,
                MomentStatus.InProgress => InProgress,
                MomentStatus.Blocked => Blocked,
                _ => Todo,
            };
        }

        /// <summary>Normalize a status color string to one of the canonical color values.</summary>
        /// <remarks>
        ///   Accepts multiple aliases: <c>"green"</c> / <c>"done"</c> -> Done,
        ///   <c>"orange"</c> / <c>"yellow"</c> / <c>"amber"</c> / <c>"inprogress"</c> -> InProgress,
        ///   <c>"black"</c> / <c>"blocked"</c> -> Blocked,
        ///   <c>"red"</c> / <c>"todo"</c> -> Todo.
        ///   Returns empty string for unrecognized values.
        /// </remarks>
        /// <param name="statusColor">The raw status color string to normalize.</param>
        /// <returns>The canonical color constant, or empty string.</returns>
        public static string Normalize(string? statusColor)
        {
            var normalized = (statusColor ?? string.Empty).Trim().ToLowerInvariant();

            return normalized switch
            {
                "green" or "done" => Done,
                "orange" or "yellow" or "amber" or "inprogress" or "in-progress" => InProgress,
                "black" or "blocked" => Blocked,
                "red" or "todo" => Todo,
                _ => string.Empty,
            };
        }

        /// <summary>Aggregate child status colors into a single roll-up color for a parent entity.</summary>
        /// <remarks>
        ///   If all children are Done -> Done. All Blocked -> Blocked. All Todo -> Todo.
        ///   All InProgress -> InProgress. Any mixed statuses -> InProgress.
        /// </remarks>
        /// <param name="childStatusColors">The status colors of the children.</param>
        /// <returns>The rolled-up status color.</returns>
        public static string RollUp(IEnumerable<string?> childStatusColors)
        {
            var normalized = childStatusColors
                .Select(Normalize)
                .Where(value => !string.IsNullOrEmpty(value))
                .ToList();

            if (normalized.Count == 0)
                return Todo;

            if (normalized.All(value => value == Blocked))
                return Blocked;

            if (normalized.All(value => value == Done))
                return Done;

            if (normalized.All(value => value == InProgress))
                return InProgress;

            if (normalized.All(value => value == Todo))
                return Todo;

            return InProgress;
        }
    }
}