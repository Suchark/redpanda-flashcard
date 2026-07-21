using MongoDB.Driver;
using RedPandaApi.Models;

namespace RedPandaApi.Services;

public class MongoSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
}

public class MongoDbService
{
    public IMongoCollection<Deck> Decks { get; }
    public IMongoCollection<Card> Cards { get; }
    public IMongoCollection<Stats> Stats { get; }

    public MongoDbService(MongoSettings settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        var db = client.GetDatabase(settings.DatabaseName);

        Decks = db.GetCollection<Deck>("decks");
        Cards = db.GetCollection<Card>("cards");
        Stats = db.GetCollection<Stats>("stats");

        // Helpful indexes
        Cards.Indexes.CreateOne(new CreateIndexModel<Card>(
            Builders<Card>.IndexKeys.Ascending(c => c.DeckId)));
        Cards.Indexes.CreateOne(new CreateIndexModel<Card>(
            Builders<Card>.IndexKeys.Ascending(c => c.NextReviewDate)));
    }
}
