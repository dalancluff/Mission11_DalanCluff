using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(BookstoreContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedBooksResponse>> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string sort = "title",
        [FromQuery] string dir = "asc",
        [FromQuery] string? category = null)
    {
        if (page < 1)
        {
            return BadRequest("page must be greater than or equal to 1.");
        }

        pageSize = Math.Clamp(pageSize, 1, 100);

        IQueryable<Book> query = context.Books.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var trimmedCategory = category.Trim();
            query = query.Where(book =>
                EF.Functions.Collate(book.Category, "NOCASE") == trimmedCategory);
        }

        var sortByTitle = string.Equals(sort, "title", StringComparison.OrdinalIgnoreCase);
        var sortDescending = string.Equals(dir, "desc", StringComparison.OrdinalIgnoreCase);

        query = sortByTitle
            ? (sortDescending ? query.OrderByDescending(book => book.Title) : query.OrderBy(book => book.Title))
            : query.OrderBy(book => book.Title);

        var totalCount = await query.CountAsync();
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedBooksResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Sort = "title",
            Dir = sortDescending ? "desc" : "asc"
        });
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<string>>> GetCategories()
    {
        var categories = await context.Books
            .AsNoTracking()
            .Where(book => !string.IsNullOrWhiteSpace(book.Category))
            .Select(book => book.Category.Trim())
            .Distinct()
            .OrderBy(category => category)
            .ToListAsync();

        return Ok(categories);
    }
}

public class PagedBooksResponse
{
    public List<Book> Items { get; set; } = [];
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public string Sort { get; set; } = "title";
    public string Dir { get; set; } = "asc";
}
