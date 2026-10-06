using ClubApp.Application.Dtos;

namespace ClubApp.Application.Interfaces;

public interface IFriendService
{
    /// <summary>Amigos confirmados del usuario autenticado.</summary>
    Task<List<FriendDto>> GetFriendsAsync(int userId);

    /// <summary>Solicitudes pendientes (recibidas y enviadas).</summary>
    Task<FriendRequestsStateDto> GetRequestsAsync(int userId);

    /// <summary>Busca personas y calcula su relación con el usuario logueado.</summary>
    Task<List<FriendSearchResultDto>> SearchAsync(int userId, string query);

    /// <summary>Envía una solicitud de amistad a <paramref name="targetUserId"/>.</summary>
    Task<FriendRequestDto> SendRequestAsync(int userId, int targetUserId);

    /// <summary>Acepta una solicitud recibida (devuelve la amistad creada).</summary>
    Task<FriendDto> AcceptRequestAsync(int userId, int requestId);

    /// <summary>Rechaza una solicitud recibida.</summary>
    Task RejectRequestAsync(int userId, int requestId);

    /// <summary>Cancela una solicitud enviada (la elimina).</summary>
    Task CancelRequestAsync(int userId, int requestId);

    /// <summary>Elimina un amigo confirmado (id de la relación).</summary>
    Task RemoveFriendAsync(int userId, int friendshipId);
}
