using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Net;
using ClubApp.Domain.Exceptions;

namespace ClubApp.API.Middlewares;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    // Inyectamos _next en el constructor
    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción capturada: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, detail) = exception switch
        {
            NotFoundException ex => (
                HttpStatusCode.NotFound, 
                "Recurso no encontrado", 
                ex.Message
            ),
            AppValidationException ex => (
                HttpStatusCode.BadRequest, 
                "Petición incorrecta", 
                ex.Message
            ),
            NotAllowedException ex => (
                HttpStatusCode.Forbidden, 
                "Acceso no permitido", 
                ex.Message
            ),
            ArgumentException ex => (
                HttpStatusCode.BadRequest, 
                "Argumento inválido", 
                ex.Message
            ),
            UnauthorizedAccessException ex => (
                HttpStatusCode.Unauthorized, 
                "No autorizado", 
                ex.Message
            ),
            _ => (
                HttpStatusCode.InternalServerError, 
                "Error interno del servidor", 
                "Ocurrió un error inesperado. Por favor, reintente más tarde."
            )
        };

        int status = (int)statusCode;

        ProblemDetails problem = new()
        {
            Status = status,
            Title = title,
            Detail = detail,
            Type = $"https://httpstatuses.com/{status}"
        };

        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";

        string json = JsonSerializer.Serialize(problem);
        await context.Response.WriteAsync(json);
    }
}