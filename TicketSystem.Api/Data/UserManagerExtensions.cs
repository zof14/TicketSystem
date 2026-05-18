using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace TicketSystem.Api.Data
{
    public static class UserManagerExtensions
    {
        public static DbContext GetDbContext<TUser>(this UserManager<TUser> userManager)
            where TUser : class
        {
            var prop = userManager.GetType().GetProperty("Context",
                System.Reflection.BindingFlags.NonPublic |
                System.Reflection.BindingFlags.Instance);
            return (DbContext)prop!.GetValue(userManager)!;
        }
    }
}