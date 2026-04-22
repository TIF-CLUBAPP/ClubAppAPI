using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MembershipsController : ControllerBase
{
    private readonly IMembershipService _membershipService;

    public MembershipsController(IMembershipService membershipService)
    {
        _membershipService = membershipService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _membershipService.GetAllMembershipsAsync());

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var membership = await _membershipService.GetByUserIdAsync(userId);
        return membership != null ? Ok(membership) : NotFound("El usuario no tiene membresía activa");
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MembershipDto dto)
    {
        await _membershipService.CreateMembershipAsync(dto);
        return Ok(new { message = "Membresía asignada correctamente" });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string newStatus)
    {
        var result = await _membershipService.UpdateStatusAsync(id, newStatus);
        return result ? Ok(new { message = "Estado actualizado" }) : NotFound();
    }
}