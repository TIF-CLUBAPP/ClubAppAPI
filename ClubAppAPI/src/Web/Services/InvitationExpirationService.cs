using ClubApp.Application.Interfaces;

namespace ClubApp.API.Services;

/// <summary>
/// Trabajo en segundo plano que vence automáticamente las invitaciones a actividades
/// que llevan más de 3 días (72 horas) sin respuesta. Se ejecuta cada 30 minutos.
/// </summary>
public class InvitationExpirationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<InvitationExpirationService> _logger;

    public InvitationExpirationService(
        IServiceScopeFactory scopeFactory,
        ILogger<InvitationExpirationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("InvitationExpirationService iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // IActivityService es scoped; se crea un scope propio por iteración.
                using var scope = _scopeFactory.CreateScope();
                var activityService = scope.ServiceProvider.GetRequiredService<IActivityService>();
                await activityService.ExpireOverdueInvitationsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al vencer invitaciones pendientes.");
            }

            // Cada 30 minutos.
            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }
    }
}
