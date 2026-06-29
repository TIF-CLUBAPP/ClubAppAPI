using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using ClubApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Protegido por Token por defecto
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _membershipService;

    public MembershipsController(IMembershipService membershipService)
    {
        _membershipService = membershipService;
    }

    // 1. GET /api/Memberships
    [HttpGet]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> GetAll()
    {
        var memberships = await _membershipService.GetAllMembershipsAsync();
        return Ok(memberships);
    }

    // 2. POST /api/Memberships (Cálculo automático en el backend)
    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] // Normalmente lo gestiona administración
    public async Task<IActionResult> Post([FromBody] CreateMembershipDto dto)
    {
        var result = await _membershipService.CreateMembershipAsync(dto);
        
        if (result == "USER_NOT_FOUND") return NotFound(new { message = "El usuario especificado no existe." });
        if (result == "OK") return Ok(new { message = "Membresía asignada y calculada correctamente a 1 mes." });
        
        return BadRequest();
    }

    // 3. GET /api/Memberships/user/{userId}
    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var membership = await _membershipService.GetMembershipByUserIdAsync(userId);
        if (membership == null) return NotFound(new { message = "El usuario no tiene membresías registradas." });
        
        return Ok(membership);
    }

    // 4. PATCH /api/Memberships/{id}/status
    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        // Casteamos el entero del DTO al Enum de Dominio
        if (!Enum.IsDefined(typeof(MembershipStatus), dto.Status))
        {
            return BadRequest(new { message = "Estado de membresía inválido." });
        }

        var result = await _membershipService.UpdateStatusAsync(id, (MembershipStatus)dto.Status);
        
        if (result == "NOT_FOUND") return NotFound(new { message = "Membresía no encontrada." });
        return Ok(new { message = "Estado actualizado correctamente." });
    }
}