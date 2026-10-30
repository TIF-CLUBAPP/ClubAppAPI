using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _membershipService;

    public MembershipsController(IMembershipService membershipService)
    {
        _membershipService = membershipService;
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> GetAll()
    {
        var memberships = await _membershipService.GetAllMembershipsAsync();
        return Ok(memberships);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var membership = await _membershipService.GetMembershipByIdAsync(id);
        if (membership == null) 
            return NotFound(new { message = $"No se encontró la membresía con ID {id}." });

        return Ok(membership);
    }

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var membership = await _membershipService.GetMembershipByUserIdAsync(userId);
        if (membership == null) 
            return NotFound(new { message = "El usuario no tiene membresías registradas." });

        return Ok(membership);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Post([FromBody] CreateMembershipDto dto)
    {
        // El servicio crea la membresía y devuelve el DTO con el ID asignado
        var createdMembership = await _membershipService.CreateMembershipAsync(dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = createdMembership.Id },
            createdMembership
        );
    }

    /// <summary>
    /// Suscripción digital al club para el usuario autenticado. Lo convierte en Socio
    /// activo (IsMember = true), crea su membresía con la categoría elegida y habilita
    /// la generación de su cuota social en "Mis Cuotas".
    /// </summary>
    [HttpPost("subscribe")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeMembershipDto dto)
    {
        if (dto == null || dto.MonthlyPrice <= 0)
        {
            return BadRequest(new { message = "Debe seleccionar una categoría de membresía válida." });
        }

        var userIdRaw = User.FindFirst("sub")?.Value
                        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdRaw, out var userId))
        {
            return Unauthorized(new { message = "Token inválido." });
        }

        var membership = await _membershipService.SubscribeAsync(userId, dto);

        return Ok(new
        {
            membershipId = membership.Id,
            status = membership.Status.ToString(),
            membershipType = dto.MembershipType,
            monthlyPrice = membership.MonthlyPrice,
            isSocio = true
        });
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        if (!Enum.IsDefined(typeof(MembershipStatus), dto.Status))
        {
            return BadRequest(new { message = "Estado de membresía inválido." });
        }

        var result = await _membershipService.UpdateStatusAsync(id, (MembershipStatus)dto.Status);

        if (result == "NOT_FOUND") 
            return NotFound(new { message = "Membresía no encontrada." });

        return Ok(new { message = "Estado actualizado correctamente." });
    }
}