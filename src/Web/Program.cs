using ClubApp.Application.Interfaces;
using ClubApp.Application.Services;
using ClubApp.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ClubApp.Domain.Interfaces;
using Microsoft.IdentityModel.Tokens; 
using System.Text; 
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. REGISTRO DE REPOSITORIOS (Capa Datos)
// ==========================================
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IEnrollmentRepository, EnrollmentRepository>();
builder.Services.AddScoped<IMembershipRepository, MembershipRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();

// ==========================================
// 2. SERVICIOS DEL SISTEMA Y AUTENTICACIÓN
// ==========================================
builder.Services.Configure<ClubApp.Infrastructure.Services.AutenticacionService.AutenticacionServiceOptions>(
    builder.Configuration.GetSection("AuthenticationService"));

builder.Services.AddScoped<ICustomAuthenticationService, ClubApp.Infrastructure.Services.AutenticacionService>();

builder.Services.AddControllers();

// Extraemos los valores validando que si no existen en el appsettings, usen un texto por defecto para no romper el arranque
string issuer = builder.Configuration["AutenticacionService:Issuer"] ?? "ClubAppServer";
string audience = builder.Configuration["AutenticacionService:Audience"] ?? "ClubAppUsers";
string secretKey = builder.Configuration["AutenticacionService:SecretForKey"] 
                   ?? builder.Configuration["AuthenticationService:SecretForKey"] 
                   ?? "EstaEsUnaClaveSecretaSuperSeguraDeRespaldo123!"; // Clave de respaldo si todo viene nulo

// Autenticación JWT Bearer Backend 
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme) 
    .AddJwtBearer(options => 
    {
        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)) // Evita el crash por nulo
        };
    });

// ==========================================
// 3. CONFIGURACIÓN DE OPENAPI (El método de tu amigo)
// ==========================================
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        // 1. Definición del esquema
        var schemeName = "ClubAppBearerAuth";

        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer", // En minúsculas para cumplir estándares de OpenAPI 3.1
            BearerFormat = "JWT",
            Description = "Acá pegar el token generado al loguearse sin la palabra 'Bearer'."
        };

        // Instanciar componentes si vienen nulos de raíz
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[schemeName] = securityScheme;

        // 2. Requerimiento global usando la nueva referencia de .NET 10
        var schemeReference = new OpenApiSecuritySchemeReference(schemeName, document);

        var requirement = new OpenApiSecurityRequirement
        {
            [schemeReference] = [] // Sintaxis limpia para los alcances (scopes) nulos
        };

        // Asignar de forma global al documento
        document.Security = new List<OpenApiSecurityRequirement> { requirement };

        return Task.CompletedTask;
    });
});
 
// ==========================================
// 4. CONFIGURACIÓN DE BASE DE DATOS (SQLite)
// ==========================================
var connection = new SqliteConnection("Data Source=miWebAppDatabase.db");
connection.Open();

using (var command = connection.CreateCommand())
{
    command.CommandText = "PRAGMA journal_mode = DELETE;";
    command.ExecuteNonQuery();
}

builder.Services.AddDbContext<ApplicationContext>(options => options.UseSqlite(connection));

// ==========================================
// 5. INYECCIÓN DE SERVICIOS DE APLICACIÓN
// ==========================================
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IMembershipService, MembershipService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

// ==========================================
// 6. PIPELINE DE EJECUCIÓN (MIDDLEWARES)
// ==========================================
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // Mapea el JSON nativo en /openapi/v1.json
    
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "ClubApp API V1 (.NET 10)");
        options.RoutePrefix = "swagger"; // Mantiene tu ruta para entrar desde /swagger
    });
}

app.UseHttpsRedirection();

app.UseAuthentication(); // 1. Identifica al usuario
app.UseAuthorization();  // 2. Valida sus permisos de Rol

app.MapControllers();

app.Run();