using ClubApp.Application.Interfaces;
using ClubApp.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// --- SERVICIOS DEL SISTEMA ---

builder.Services.AddControllers();

// Configuración de OpenAPI / Swagger
builder.Services.AddOpenApi();

// Configure the SQLite connection
var connection = new SqliteConnection("Data Source=miWebAppDatabase.db");
connection.Open();

// Set journal mode to DELETE using PRAGMA statement
using (var command = connection.CreateCommand())
{
    command.CommandText = "PRAGMA journal_mode = DELETE;";
    command.ExecuteNonQuery();
}

builder.Services.AddDbContext<ApplicationContext>(options => options.UseSqlite(connection));

// --- INYECCIÓN DE DEPENDENCIAS (EL "CABLEADO") ---
// Aquí le decimos al sistema: "Cuando un Controller pida IActivityService, dale ActivityService"
builder.Services.AddScoped<IActivityService, ActivityService>();

//Enrollment builder inscripcion
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();

//User builder 
builder.Services.AddScoped<IUserService, UserService>();

//Notification builder
builder.Services.AddScoped<INotificationService, NotificationService>();

//MemberShip builder membresia
builder.Services.AddScoped<IMembershipService, MembershipService>();

//Payment builder pago
builder.Services.AddScoped<IPaymentService, PaymentService>();


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
