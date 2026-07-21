using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RedPandaApi.Models;

public class Deck
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Color { get; set; } = "#E8846B"; // red panda orange by default
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
