using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ClubApp.API.Controllers;

/// <summary>
/// Sistema de amistades: amigos confirmados, solicitudes y búsqueda de personas.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController : ControllerBase
{
    private readonly IFriendService _friendService;

    public FriendsController(IFriendService friendService)
    {
        _friendService = friendService;
    }

    /// <summary>Lista de amigos confirmados del usuario logueado (GET /api/friends).</summary>
    [HttpGet]
    public async Task<IActionResult> GetFriends()
        => Ok(await _friendService.GetFriendsAsync(GetUserId()));

    /// <summary>Solicitudes pendientes, recibidas y enviadas (GET /api/friends/requests).</summary>
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
        => Ok(await _friendService.GetRequestsAsync(GetUserId()));

    /// <summary>Busca personas y calcula su relación con el usuario logueado.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query = "")
        => Ok(await _friendService.SearchAsync(GetUserId(), query));

    /// <summary>Envía una solicitud de amistad (POST /api/friends/requests).</summary>
    [HttpPost("requests")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDto dto)
    {
        if (dto == null) return BadRequest(new { message = "request inválido" });

        var result = await _friendService.SendRequestAsync(GetUserId(), dto.TargetUserId);
        return Ok(result);
    }

    /// <summary>Acepta una solicitud recibida (POST /api/friends/requests/{id}/accept).</summary>
    [HttpPost("requests/{id:int}/accept")]
    public async Task<IActionResult> AcceptRequest(int id)
        => Ok(await _friendService.AcceptRequestAsync(GetUserId(), id));

    /// <summary>Rechaza una solicitud recibida (POST /api/friends/requests/{id}/reject).</summary>
    [HttpPost("requests/{id:int}/reject")]
    public async Task<IActionResult> RejectRequest(int id)
    {
        await _friendService.RejectRequestAsync(GetUserId(), id);
        return Ok(new { message = "Solicitud rechazada." });
    }

    /// <summary>Cancela una solicitud enviada (DELETE /api/friends/requests/{id}).</summary>
    [HttpDelete("requests/{id:int}")]
    public async Task<IActionResult> CancelRequest(int id)
    {
        await _friendService.CancelRequestAsync(GetUserId(), id);
        return Ok(new { message = "Solicitud cancelada." });
    }

    /// <summary>Elimina un amigo confirmado, por id de la relación (DELETE /api/friends/{id}).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> RemoveFriend(int id)
    {
        await _friendService.RemoveFriendAsync(GetUserId(), id);
        return Ok(new { message = "Amigo eliminado." });
    }

    private int GetUserId()
    {
        var raw = User.FindFirst("sub")?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(raw, out var id)) return id;
        throw new UnauthorizedAccessException("Token inválido.");
    }
}
