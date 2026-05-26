using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace PromiseModelOnline.Api.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        // ✅ Centralized user ID extraction (robust across auth providers)
        private string? GetUserId()
        {
            return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? Context.User?.FindFirst("sub")?.Value
                ?? Context.User?.FindFirst("id")?.Value;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();

            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    $"user-{userId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();

            if (!string.IsNullOrWhiteSpace(userId))
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    $"user-{userId}");
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ✅ Optional: Allow client to join project group (future scalability)
        public async Task JoinProjectGroup(string projectId)
        {
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    $"project-{projectId}");
            }
        }

        public async Task LeaveProjectGroup(string projectId)
        {
            if (!string.IsNullOrWhiteSpace(projectId))
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    $"project-{projectId}");
            }
        }

        // ✅ Optional: test/debug helper (remove in production if desired)
        public async Task Ping()
        {
            await Clients.Caller.SendAsync("Pong", "Connected");
        }
    }
}