using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using PromiseModelOnline.Api.DAL;
using PromiseModelOnline.Api.Enums;
using PromiseModelOnline.Api.Models;

namespace PromiseModelOnline.Api.Tests
{
    [TestFixture]
    public class UserRepositoryUnitTests
    {
        private PromiseModelOnlineContext _context = null!;
        private UserRepository _repo = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<PromiseModelOnlineContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new PromiseModelOnlineContext(options);
            _repo = new UserRepository(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        [Test]
        public async Task GetUsersByNameAsync_ReturnsMatchingUsers()
        {
            _context.Users.AddRange(
                new User { Id = 1, Name = "Alice", Email = "alice@example.com" },
                new User { Id = 2, Name = "Bob", Email = "bob@example.com" },
                new User { Id = 3, Name = "Alice", Email = "alice2@example.com" }
            );
            await _context.SaveChangesAsync();

            var result = await _repo.GetUsersByNameAsync("Alice");
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(2));
            Assert.That(list.All(u => u.Name == "Alice"), Is.True);
            Assert.That(list.Select(u => u.Id), Is.EquivalentTo(new[] { 1, 3 }));
        }

        [Test]
        public async Task GetUsersByNameAsync_NoMatch_ReturnsEmpty()
        {
            _context.Users.Add(new User { Name = "Charlie", Email = "charlie@example.com" });
            await _context.SaveChangesAsync();

            var result = await _repo.GetUsersByNameAsync("Nobody");
            Assert.That(result, Is.Empty);
        }

        [Test]
        public async Task FindByEmailAsync_ReturnsMatchingUsers()
        {
            _context.Users.AddRange(
                new User { Id = 1, Email = "alice@example.com", Name = "Alice" },
                new User { Id = 2, Email = "bob@example.com", Name = "Bob" }
            );
            await _context.SaveChangesAsync();

            var result = await _repo.FindByEmailAsync("alice@example.com");
            var list = result.ToList();

            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].Id, Is.EqualTo(1));
        }

        [Test]
        public async Task FindByEmailAsync_NoMatch_ReturnsEmpty()
        {
            var result = await _repo.FindByEmailAsync("nobody@example.com");
            Assert.That(result, Is.Empty);
        }

        // ------- GetOrCreateUserByEmailAsync -------

        [Test]
        public async Task GetOrCreateUserByEmailAsync_UserDoesNotExist_CreatesWithUsername()
        {
            var user = await _repo.GetOrCreateUserByEmailAsync("test@example.com", "testuser");

            Assert.That(user, Is.Not.Null);
            Assert.That(user.Email, Is.EqualTo("test@example.com"));
            Assert.That(user.Name, Is.EqualTo("testuser"));
            Assert.That(user.Role, Is.EqualTo(UserRole.Professional));
            Assert.That(user.CreatedAt, Is.Not.EqualTo(default(DateTime)));

            var saved = await _context.Users.FirstOrDefaultAsync(u => u.Email == "test@example.com");
            Assert.That(saved, Is.Not.Null);
        }

        [Test]
        public async Task GetOrCreateUserByEmailAsync_UserDoesNotExist_NoUsername_UsesEmailPrefix()
        {
            var user = await _repo.GetOrCreateUserByEmailAsync("john.doe@example.com");

            Assert.That(user.Name, Is.EqualTo("john.doe"));
        }

        [Test]
        public async Task GetOrCreateUserByEmailAsync_UserDoesNotExist_EmailWithoutAt_UsesUnknown()
        {
            var user = await _repo.GetOrCreateUserByEmailAsync("invalid-email");

            Assert.That(user.Name, Is.EqualTo("Unknown"));
        }

        [Test]
        public async Task GetOrCreateUserByEmailAsync_UserExists_NameIsEmail_GivenRealUsername_UpdatesName()
        {
            // Arrange
            var existing = new User
            {
                Email = "old@example.com",
                Name = "old@example.com", // name == email
                Role = UserRole.Student,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };
            _context.Users.Add(existing);
            await _context.SaveChangesAsync();

            // Act
            var user = await _repo.GetOrCreateUserByEmailAsync("old@example.com", "newalias");

            // Assert
            Assert.That(user.Id, Is.EqualTo(existing.Id));
            Assert.That(user.Name, Is.EqualTo("newalias"));

            var saved = await _context.Users.FindAsync(existing.Id);
            Assert.That(saved!.Name, Is.EqualTo("newalias"));
        }

        [Test]
        public async Task GetOrCreateUserByEmailAsync_UserExists_NameAlreadySet_DoesNotOverwrite()
        {
            // Arrange
            var existing = new User
            {
                Email = "keep@example.com",
                Name = "KeepMe",
                Role = UserRole.Professional,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(existing);
            await _context.SaveChangesAsync();

            // Act
            var user = await _repo.GetOrCreateUserByEmailAsync("keep@example.com", "ignoreme");

            // Assert
            Assert.That(user.Name, Is.EqualTo("KeepMe"));
            var saved = await _context.Users.FindAsync(existing.Id);
            Assert.That(saved!.Name, Is.EqualTo("KeepMe"));
        }

        [Test]
        public async Task GetOrCreateUserByEmailAsync_UserExists_NullUsername_NoChange()
        {
            // Arrange
            var existing = new User
            {
                Email = "nulluser@example.com",
                Name = "nulluser@example.com",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(existing);
            await _context.SaveChangesAsync();

            // Act
            var user = await _repo.GetOrCreateUserByEmailAsync("nulluser@example.com", null);

            // Assert
            Assert.That(user.Name, Is.EqualTo("nulluser@example.com"));
        }

        // Inherited generic methods
        [Test]
        public async Task GetByIdAsync_ReturnsEntity()
        {
            var user = new User { Id = 42, Name = "Test", Email = "test@example.com" };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var result = await _repo.GetByIdAsync(42);
            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Name, Is.EqualTo("Test"));
        }

        [Test]
        public async Task AddAsync_PersistsEntity()
        {
            var user = new User { Name = "New", Email = "new@example.com", Role = UserRole.Student };
            await _repo.AddAsync(user);

            var saved = _context.Users.FirstOrDefault(u => u.Email == "new@example.com");
            Assert.That(saved, Is.Not.Null);
            Assert.That(saved!.Role, Is.EqualTo(UserRole.Student));
        }
    }
}