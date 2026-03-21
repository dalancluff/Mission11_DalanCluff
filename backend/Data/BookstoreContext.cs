using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class BookstoreContext(DbContextOptions<BookstoreContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasKey(book => book.BookId);
            entity.Property(book => book.Title).IsRequired();
            entity.Property(book => book.Author).IsRequired();
            entity.Property(book => book.Publisher).IsRequired();
            entity.Property(book => book.Isbn).IsRequired();
            entity.Property(book => book.Classification).IsRequired();
            entity.Property(book => book.Category).IsRequired();
            entity.Property(book => book.PageCount).IsRequired();
            entity.Property(book => book.Price).IsRequired();
        });
    }
}
