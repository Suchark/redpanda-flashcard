using System.Text.Json;
using RedPandaApi.Models;
using System.Text.RegularExpressions;
using System.Net;

namespace RedPandaApi.Services;

// Uses two free, no-API-key-required public services:
//  - https://dictionaryapi.dev  (English definitions, phonetics, examples)
//  - https://mymemory.translated.net (EN -> TH translation)
public class DictionaryService
{
    private readonly HttpClient _http;
    private static string CleanTranslation(string text) {
        if (string.IsNullOrWhiteSpace(text)) return text;
        var withoutTags = Regex.Replace(text, "<[^>]+>", "");
        return WebUtility.HtmlDecode(withoutTags).Trim();
    }

    public DictionaryService(IHttpClientFactory factory)
    {
        _http = factory.CreateClient();
        _http.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<LookupResult> LookupAsync(string word)
    {
        var result = new LookupResult { Word = word };

        try
        {
            var url = $"https://api.dictionaryapi.dev/api/v2/entries/en/{Uri.EscapeDataString(word)}";
            var resp = await _http.GetAsync(url);

            if (!resp.IsSuccessStatusCode)
            {
                result.Found = false;
                result.Error = "ไม่พบคำนี้ในพจนานุกรม กรุณากรอกข้อมูลเอง";
            }
            else
            {
                var json = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var entry = doc.RootElement[0];

                if (entry.TryGetProperty("phonetic", out var phon))
                    result.Phonetic = phon.GetString() ?? string.Empty;

                if (entry.TryGetProperty("meanings", out var meanings) && meanings.GetArrayLength() > 0)
                {
                    var firstMeaning = meanings[0];

                    if (firstMeaning.TryGetProperty("partOfSpeech", out var pos))
                        result.PartOfSpeech = pos.GetString() ?? string.Empty;

                    if (firstMeaning.TryGetProperty("definitions", out var defs) && defs.GetArrayLength() > 0)
                    {
                        var firstDef = defs[0];

                        if (firstDef.TryGetProperty("definition", out var defText))
                            result.MeaningEn = defText.GetString() ?? string.Empty;

                        if (firstDef.TryGetProperty("example", out var exampleText))
                            result.ExampleSentence = exampleText.GetString() ?? string.Empty;

                        if (firstDef.TryGetProperty("synonyms", out var syns) && syns.GetArrayLength() > 0)
                        {
                            result.RelatedWords = syns.EnumerateArray()
                                .Select(s => s.GetString() ?? string.Empty)
                                .Where(s => !string.IsNullOrEmpty(s))
                                .Take(5)
                                .ToList();
                        }
                    }
                }
            }
        }
        catch
        {
            result.Found = false;
            result.Error = "เรียก dictionary API ไม่สำเร็จ กรุณากรอกข้อมูลเอง";
        }

        // Try to get Thai translation regardless (uses the word itself, or the EN meaning if available)
        try
        {
            var textToTranslate = string.IsNullOrWhiteSpace(result.MeaningEn) ? word : word;
            var transUrl = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(textToTranslate)}&langpair=en|th";
            var transResp = await _http.GetAsync(transUrl);

            if (transResp.IsSuccessStatusCode)
            {
                var transJson = await transResp.Content.ReadAsStringAsync();
                using var transDoc = JsonDocument.Parse(transJson);
                if (transDoc.RootElement.TryGetProperty("responseData", out var respData) &&
                    respData.TryGetProperty("translatedText", out var translated))
                {
                    result.MeaningTh = CleanTranslation(translated.GetString() ?? string.Empty);
                }
            }
        }
        catch
        {
            // translation is best-effort; ignore failures
        }

        return result;
    }
}
