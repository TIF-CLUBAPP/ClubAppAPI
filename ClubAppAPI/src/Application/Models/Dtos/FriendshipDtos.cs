using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ClubApp.Application.Dtos;

/// <summary>Resumen mínimo de un usuario expuesto en listas de amigos y búsqueda.</summary>
public class FriendUserSummaryDto
{
    [JsonPropertyName("id")] public int Id { get; set; }
    [JsonPropertyName("fullName")] public string FullName { get; set; } = string.Empty;
    [JsonPropertyName("firstName")] public string FirstName { get; set; } = string.Empty;
    [JsonPropertyName("lastName")] public string LastName { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("username")] public string? Username { get; set; }
    [JsonPropertyName("isActive")] public bool IsActive { get; set; }
}

/// <summary>Amistad confirmada entre el usuario logueado y <see cref="Friend"/>.</summary>
public class FriendDto
{
    /// <summary>Id de la relación de amistad.</summary>
    [JsonPropertyName("id")] public int Id { get; set; }

    [JsonPropertyName("friend")] public FriendUserSummaryDto Friend { get; set; } = new();

    /// <summary>Fecha en que se confirmó la amistad (ISO 8601).</summary>
    [JsonPropertyName("since")] public string? Since { get; set; }
}

/// <summary>Solicitud de amistad vista desde el usuario logueado.</summary>
public class FriendRequestDto
{
    [JsonPropertyName("id")] public int Id { get; set; }

    /// <summary>"received" o "sent" según la perspectiva del usuario logueado.</summary>
    [JsonPropertyName("direction")] public string Direction { get; set; } = "received";

    [JsonPropertyName("user")] public FriendUserSummaryDto User { get; set; } = new();

    [JsonPropertyName("status")] public string Status { get; set; } = "PENDING";

    [JsonPropertyName("createdAt")] public string CreatedAt { get; set; } = string.Empty;
}

/// <summary>Estado agregado de solicitudes pendientes (recibidas y enviadas).</summary>
public class FriendRequestsStateDto
{
    [JsonPropertyName("received")] public List<FriendRequestDto> Received { get; set; } = new();
    [JsonPropertyName("sent")] public List<FriendRequestDto> Sent { get; set; } = new();
}

/// <summary>Resultado de búsqueda de personas con su relación respecto al usuario logueado.</summary>
public class FriendSearchResultDto
{
    [JsonPropertyName("user")] public FriendUserSummaryDto User { get; set; } = new();

    /// <summary>none | friends | request_sent | request_received</summary>
    [JsonPropertyName("relation")] public string Relation { get; set; } = "none";

    /// <summary>Id de la solicitud involucrada, si la hay.</summary>
    [JsonPropertyName("requestId")] public int? RequestId { get; set; }
}

/// <summary>Body para enviar una solicitud de amistad (POST /api/friends/requests).</summary>
public class SendFriendRequestDto
{
    [JsonPropertyName("targetUserId")] public int TargetUserId { get; set; }
}
