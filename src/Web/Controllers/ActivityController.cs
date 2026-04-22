using Microsoft.AspNetCore.Mvc;
using ClubApp.Application.Interfaces;
using ClubApp.Application.Dtos; // Importante para que reconozca ActivityDto

namespace ClubApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpGet]
    public async Task<IActionResult> Get() => Ok(await _activityService.GetAllAvailableActivitiesAsync());

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ActivityDto dto)
    {
        await _activityService.CreateActivityAsync(dto);
        return Ok("Actividad creada en memoria");
    }
}