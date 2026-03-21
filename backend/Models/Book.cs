using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("Books")]
public class Book
{
    [Key]
    [Column("BookID")]
    public int BookId { get; set; }

    [Required]
    [Column("Title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [Column("Author")]
    public string Author { get; set; } = string.Empty;

    [Required]
    [Column("Publisher")]
    public string Publisher { get; set; } = string.Empty;

    [Required]
    [Column("ISBN")]
    public string Isbn { get; set; } = string.Empty;

    [Required]
    [Column("Classification")]
    public string Classification { get; set; } = string.Empty;

    [Required]
    [Column("Category")]
    public string Category { get; set; } = string.Empty;

    [Column("PageCount")]
    public int PageCount { get; set; }

    [Column("Price")]
    public decimal Price { get; set; }
}
