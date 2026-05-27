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
    public async Task<IActionResult> GetAll() => Ok(await _membershipService.GetAllMembershipsAsync());

    [HttpGet("user/{userId:int}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var membership = await _membershipService.GetByUserIdAsync(userId);
        return membership != null ? Ok(membership) : NotFound("El usuario no tiene membresía activa");
    }

    // =======================================================================
    // ACCIONES EXCLUSIVAS PARA ADMINISTRADORES
    // =======================================================================

    [HttpPost]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> Create([FromBody] MembershipDto dto)
    {
        await _membershipService.CreateMembershipAsync(dto);
        return Ok(new { message = "Membresía asignada correctamente" });
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "ADMIN,SUPERADMIN")] 
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] MembershipStatus newStatus) 
    {
        var result = await _membershipService.UpdateStatusAsync(id, newStatus);
        return result ? Ok(new { message = "Estado actualizado" }) : NotFound();
    }
}