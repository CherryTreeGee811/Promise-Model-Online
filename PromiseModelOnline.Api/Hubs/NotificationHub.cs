using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace PromiseModelOnline.Api.Hubs;

/// <summary>SignalR hub for real-time notification delivery to connected users.</summary>
/// <remarks>
///   Requires authentication. On connect, adds the connection to a user-specific group
///   (<c>"user-{userId}"</c>) so that notifications can be pushed to all active sessions
///   for that user. On disconnect, removes the connection from the group.
/// </remarks>
[Authorize]
public class NotificationHub : Hub
{
    /// <summary>Add the connection to the user-specific group on connect.</summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("sub")?.Value
                  ?? Context.User?.FindFirst("id")?.Value;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"user-{userId}"
            );
        }
        await base.OnConnectedAsync();
    }

    /// <summary>Remove the connection from the user-specific group on disconnect.</summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("sub")?.Value
                  ?? Context.User?.FindFirst("id")?.Value;

        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.RemoveFromGroupAsync(
                Context.ConnectionId,
                $"user-{userId}"
            );
        }

        await base.OnDisconnectedAsync(exception);
    }
}
