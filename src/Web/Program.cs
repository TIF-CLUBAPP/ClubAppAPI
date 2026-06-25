using ClubApp.Application.Interfaces;
using ClubApp.Application.Services;
using ClubApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ClubApp.Domain.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using ClubApp.Infrastructure.Services;

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
builder.Services.AddScoped<ICustomAuthenticationService, AutenticacionService>();

builder.Services.AddControllers();

string issuer = builder.Configuration["Authentication:Issuer"] ?? "ClubAppAPI";
string audience = builder.Configuration["Authentication:Audience"] ?? "ClubAppUsers";
string secretKey = builder.Configuration["Authentication:SecretForKey"]
                    ?? "esta_es_una_clave_secreta_de_auxilio_super_larga_12345";

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

// ==========================================
// 3. CONFIGURACIÓN DE OPENAPI
// ==========================================
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        var schemeName = "ClubAppBearerAuth";

        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Acá pegar el token generado al loguearse sin la palabra 'Bearer'."
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[schemeName] = securityScheme;

        var schemeReference = new OpenApiSecuritySchemeReference(schemeName, document);

        var requirement = new OpenApiSecurityRequirement
        {
            [schemeReference] = []
        };

        document.Security = new List<OpenApiSecurityRequirement> { requirement };

        return Task.CompletedTask;
    });
});

// ==========================================
// 4. CONFIGURACIÓN DE BASE DE DATOS (SQLite)
// ==========================================
// Levantamos la conexión limpia según el entorno activo (Development o Production)
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("La cadena de conexión 'DefaultConnection' no fue encontrada.");

builder.Services.AddDbContext<ApplicationContext>(options => 
    options.UseSqlite(connectionString, b => b.MigrationsAssembly("Infrastructure")));

// ==========================================
// 5. INYECCIÓN DE SERVICIOS DE APLICACIÓN
// ==========================================
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IMembershipService, MembershipService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddHttpClient<IWeatherService, WeatherService>();

// ==========================================
// 6. PIPELINE DE EJECUCIÓN (MIDDLEWARES)
// ==========================================
var app = builder.Build();

#region Apply EF migrations
using (var serviceScope = app.Services.CreateScope())
{
    try
    {
        var dbContext = serviceScope.ServiceProvider.GetRequiredService<ApplicationContext>();
        dbContext.Database.Migrate(); 
    }
    catch (Exception ex)
    {
        var logger = serviceScope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error aplicando las migraciones de Entity Framework.");
    }
}
#endregion

app.MapOpenApi();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/openapi/v1.json", "ClubApp API V1 (.NET 10)");
    options.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();