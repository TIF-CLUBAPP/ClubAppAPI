using Microsoft.EntityFrameworkCore;
using ClubApp.Application.Dtos;
using ClubApp.Application.Interfaces;
using ClubApp.Domain.Entities;
using ClubApp.Domain.Exceptions;
using ClubApp.Infrastructure.Data;

namespace ClubApp.Infrastructure.Services;

public class FriendService : IFriendService
{
    private readonly ApplicationContext _context;

    public FriendService(ApplicationContext context)
    {
        _context = context;
    }

    public async Task<List<FriendDto>> GetFriendsAsync(int userId)
    {
        var friendships = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted &&
                        (f.RequesterId == userId || f.AddresseeId == userId))
            .Include(f => f.Requester)
            .Include(f => f.Addressee)
            .ToListAsync();

        return friendships
            .Select(f => BuildFriendDto(f, f.RequesterId == userId ? f.Addressee : f.Requester))
            .OrderBy(d => d.Friend.FullName)
            .ToList();
    }

    public async Task<FriendRequestsStateDto> GetRequestsAsync(int userId)
    {
        var received = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Pending && f.AddresseeId == userId)
            .Include(f => f.Requester)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        var sent = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Pending && f.RequesterId == userId)
            .Include(f => f.Addressee)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return new FriendRequestsStateDto
        {
            Received = received.Select(f => BuildRequestDto(f, "received", f.Requester)).ToList(),
            Sent = sent.Select(f => BuildRequestDto(f, "sent", f.Addressee)).ToList()
        };
    }

    public async Task<List<FriendSearchResultDto>> SearchAsync(int userId, string query)
    {
        var term = query?.Trim() ?? string.Empty;
        if (term.Length == 0)
            return new List<FriendSearchResultDto>();

        var acceptedIds = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted &&
                        (f.RequesterId == userId || f.AddresseeId == userId))
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();

        var pendingSent = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Pending && f.RequesterId == userId)
            .Select(f => new { f.Id, UserId = f.AddresseeId })
            .ToListAsync();

        var pendingReceived = await _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Pending && f.AddresseeId == userId)
            .Select(f => new { f.Id, UserId = f.RequesterId })
            .ToListAsync();

        var lowered = term.ToLower();
        var candidates = await _context.Users
            .Where(u => !u.IsDeleted && u.Id != userId)
            .Where(u =>
                (u.FirstName ?? string.Empty).ToLower().Contains(lowered) ||
                (u.LastName ?? string.Empty).ToLower().Contains(lowered) ||
                (u.FirstName + " " + u.LastName).ToLower().Contains(lowered) ||
                (u.Email ?? string.Empty).ToLower().Contains(lowered))
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Take(20)
            .ToListAsync();

        var results = new List<FriendSearchResultDto>(candidates.Count);
        foreach (var user in candidates)
        {
            var summary = ToSummary(user);

            if (acceptedIds.Contains(user.Id))
            {
                results.Add(new FriendSearchResultDto { User = summary, Relation = "friends", RequestId = null });
                continue;
            }

            var sent = pendingSent.FirstOrDefault(x => x.UserId == user.Id);
            if (sent != null)
            {
                results.Add(new FriendSearchResultDto { User = summary, Relation = "request_sent", RequestId = sent.Id });
                continue;
            }

            var received = pendingReceived.FirstOrDefault(x => x.UserId == user.Id);
            if (received != null)
            {
                results.Add(new FriendSearchResultDto { User = summary, Relation = "request_received", RequestId = received.Id });
                continue;
            }

            results.Add(new FriendSearchResultDto { User = summary, Relation = "none", RequestId = null });
        }

        return results;
    }

    public async Task<FriendRequestDto> SendRequestAsync(int userId, int targetUserId)
    {
        if (targetUserId <= 0)
            throw new AppValidationException("Debés indicar a quién querés agregar.");

        if (targetUserId == userId)
            throw new AppValidationException("No podés agregarte a vos mismo.");

        var target = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == targetUserId && !u.IsDeleted);
        if (target == null)
            throw new NotFoundException("User", targetUserId);

        var existing = await _context.Friendships.FirstOrDefaultAsync(f =>
            (f.RequesterId == userId && f.AddresseeId == targetUserId) ||
            (f.RequesterId == targetUserId && f.AddresseeId == userId));

        if (existing != null)
        {
            if (existing.Status == FriendshipStatus.Accepted)
                throw new AppValidationException("Ya son amigos.");

            if (existing.Status == FriendshipStatus.Pending)
            {
                if (existing.RequesterId == userId)
                    throw new AppValidationException("Ya enviaste una solicitud a esta persona.");

                throw new AppValidationException("Esta persona ya te envió una solicitud. Aceptala desde tus solicitudes.");
            }

            // Rejected: se reutiliza la fila reactivando la solicitud en la dirección correcta.
            existing.RequesterId = userId;
            existing.AddresseeId = targetUserId;
            existing.Status = FriendshipStatus.Pending;
            existing.CreatedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return BuildRequestDto(existing, "sent", target);
        }

        var friendship = new Friendship
        {
            RequesterId = userId,
            AddresseeId = targetUserId,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();

        return BuildRequestDto(friendship, "sent", target);
    }

    public async Task<FriendDto> AcceptRequestAsync(int userId, int requestId)
    {
        var friendship = await _context.Friendships
            .Include(f => f.Requester)
            .FirstOrDefaultAsync(f => f.Id == requestId);

        if (friendship == null)
            throw new NotFoundException("Friendship", requestId);

        if (friendship.AddresseeId != userId)
            throw new NotAllowedException("Solo el destinatario puede aceptar la solicitud.");

        if (friendship.Status == FriendshipStatus.Accepted)
            throw new AppValidationException("Ya son amigos.");

        friendship.Status = FriendshipStatus.Accepted;
        friendship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return BuildFriendDto(friendship, friendship.Requester);
    }

    public async Task RejectRequestAsync(int userId, int requestId)
    {
        var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.Id == requestId);
        if (friendship == null)
            throw new NotFoundException("Friendship", requestId);

        if (friendship.AddresseeId != userId)
            throw new NotAllowedException("Solo el destinatario puede rechazar la solicitud.");

        friendship.Status = FriendshipStatus.Rejected;
        friendship.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task CancelRequestAsync(int userId, int requestId)
    {
        var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.Id == requestId);
        if (friendship == null)
            throw new NotFoundException("Friendship", requestId);

        if (friendship.RequesterId != userId)
            throw new NotAllowedException("Solo el remitente puede cancelar la solicitud.");

        if (friendship.Status != FriendshipStatus.Pending)
            throw new AppValidationException("La solicitud ya no está pendiente.");

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveFriendAsync(int userId, int friendshipId)
    {
        var friendship = await _context.Friendships.FirstOrDefaultAsync(f => f.Id == friendshipId);
        if (friendship == null)
            throw new NotFoundException("Friendship", friendshipId);

        if (friendship.RequesterId != userId && friendship.AddresseeId != userId)
            throw new NotAllowedException("No podés eliminar esta amistad.");

        if (friendship.Status != FriendshipStatus.Accepted)
            throw new AppValidationException("No existe una amistad activa para eliminar.");

        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
    }

    // ============ Helpers ============

    private static FriendUserSummaryDto ToSummary(User user)
    {
        var email = user.Email ?? string.Empty;
        var atIndex = email.IndexOf('@');
        return new FriendUserSummaryDto
        {
            Id = user.Id,
            FullName = user.FullName,
            FirstName = user.FirstName ?? string.Empty,
            LastName = user.LastName ?? string.Empty,
            Email = email,
            Username = atIndex > 0 ? email.Substring(0, atIndex) : email,
            IsActive = user.IsActive
        };
    }

    private static FriendDto BuildFriendDto(Friendship friendship, User other)
    {
        return new FriendDto
        {
            Id = friendship.Id,
            Friend = ToSummary(other),
            Since = friendship.UpdatedAt.ToString("O")
        };
    }

    private static FriendRequestDto BuildRequestDto(Friendship friendship, string direction, User other)
    {
        return new FriendRequestDto
        {
            Id = friendship.Id,
            Direction = direction,
            User = ToSummary(other),
            Status = friendship.Status.ToString().ToUpperInvariant(),
            CreatedAt = friendship.CreatedAt.ToString("O")
        };
    }
}


