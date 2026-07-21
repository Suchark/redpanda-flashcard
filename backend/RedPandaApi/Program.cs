using RedPandaApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Config ----
var mongoSettings = builder.Configuration.GetSection("MongoSettings").Get<MongoSettings>()
    ?? new MongoSettings { ConnectionString = "mongodb://localhost:27017", DatabaseName = "redpanda_flashcards" };

var allowedOrigin = builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173";

// ---- Services ----
builder.Services.AddSingleton(mongoSettings);
builder.Services.AddSingleton<MongoDbService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<DictionaryService>();

builder.Services.AddControllers().AddJsonOptions(opts =>
{
    opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => "Red Panda Flashcard API is running 🐼");

app.Run();
