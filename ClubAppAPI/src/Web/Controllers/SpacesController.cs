using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace ClubApp.API.Controllers;

/// <summary>
/// Gestión de Espacios Físicos (Canchas, Salones, Quinchos, etc.)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN,SUPERADMIN")]
public class SpacesController : ControllerBase
{
    private readonly ISpaceService _spaceService;

    public SpacesController(ISpaceService spaceService)
    {
        _spaceService = spaceService;
    }

    [HttpGet]
    [AllowAnonymous] 
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _spaceService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var space = await _spaceService.GetByIdAsync(id);
        if (space == null) return NotFound(new { message = "Espacio no encontrado." });
        return Ok(space);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveSpaceRequest dto)
    {
        var created = await _spaceService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveSpaceRequest dto)
    {
        var result = await _spaceService.UpdateAsync(id, dto);
        if (result == null) return NotFound(new { message = "Espacio no encontrado." });
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _spaceService.DeleteAsync(id);
        if (!result) return NotFound(new { message = "Espacio no encontrado o en uso." });
        return Ok(new { message = "Espacio eliminado." });
    }
}
