using ClubApp.Application.Interfaces;
using ClubApp.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// --- SERVICIOS DEL SISTEMA ---

builder.Services.AddControllers();

// Configuración de OpenAPI / Swagger
builder.Services.AddOpenApi();

// --- INYECCIÓN DE DEPENDENCIAS (EL "CABLEADO") ---
// Aquí le decimos al sistema: "Cuando un Controller pida IActivityService, dale ActivityService"
builder.Services.AddScoped<IActivityService, ActivityService>();

// ----------------------------------------------

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
       // Esto permite que veas la interfaz gráfica de Swagger para probar tus métodos
       options.SwaggerEndpoint("/openapi/v1.json", "ClubApp API V1"); 
       options.RoutePrefix = "swagger"; // Podrás entrar en http://localhost:PORT/swagger
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
