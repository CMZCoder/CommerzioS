
import { db } from "../server/db";
import { orders, services, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedTransactions() {
    console.log("🌱 Seeding transactions...");

    try {
        // 1. Get the main user (assume the first user or a specific one used for testing)
        // For simplicity, we'll try to find a user who has services (to be a vendor) 
        // and just use them as customer too if needed, or find a second user.

        // In a dev environment, let's just grab the first 2 users.
        const allUsers = await db.select().from(users).limit(2);

        if (allUsers.length === 0) {
            console.error("❌ No users found. Please register a user first.");
            process.exit(1);
        }

        const mainUser = allUsers[0];
        const otherUser = allUsers.length > 1 ? allUsers[1] : allUsers[0]; // If only 1 user, self-deal (allowed for testing)

        console.log(`Using main user: ${mainUser.email} (${mainUser.id})`);

        // 2. Get some services
        const allServices = await db.select().from(services).limit(3);
        if (allServices.length === 0) {
            console.error("❌ No services found. Please create some services first.");
            process.exit(1);
        }

        // 3. Create Purchases (User is Customer)
        console.log("Creating purchases...");
        const purchases = [
            {
                orderNumber: `ORD-${Date.now()}-1`,
                customerId: mainUser.id,
                vendorId: otherUser.id,
                serviceId: allServices[0].id,
                unitPrice: "50.00",
                quantity: 1,
                subtotal: "50.00",
                platformFee: "4.00",
                total: "54.00",
                status: "completed",
                paymentStatus: "succeeded",
                createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
            },
            {
                orderNumber: `ORD-${Date.now()}-2`,
                customerId: mainUser.id,
                vendorId: otherUser.id,
                serviceId: allServices[1] ? allServices[1].id : allServices[0].id,
                unitPrice: "120.00",
                quantity: 1,
                subtotal: "120.00",
                platformFee: "9.60",
                total: "129.60",
                status: "completed",
                paymentStatus: "succeeded",
                createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
            },
            {
                orderNumber: `ORD-${Date.now()}-3`,
                customerId: mainUser.id,
                vendorId: otherUser.id,
                serviceId: allServices[0].id,
                unitPrice: "75.00",
                quantity: 1,
                subtotal: "75.00",
                platformFee: "6.00",
                total: "81.00",
                status: "pending",
                paymentStatus: "pending",
                createdAt: new Date(), // Today
            }
        ];

        await db.insert(orders).values(purchases as any);

        // 4. Create Sales (User is Vendor)
        console.log("Creating sales...");
        const sales = [
            {
                orderNumber: `ORD-${Date.now()}-4`,
                customerId: otherUser.id,
                vendorId: mainUser.id, // Main user is vendor
                serviceId: allServices[0].id,
                unitPrice: "200.00",
                quantity: 1,
                subtotal: "200.00",
                platformFee: "16.00",
                total: "216.00",
                status: "completed",
                paymentStatus: "succeeded",
                createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
            },
            {
                orderNumber: `ORD-${Date.now()}-5`,
                customerId: otherUser.id,
                vendorId: mainUser.id,
                serviceId: allServices[0].id,
                unitPrice: "150.00",
                quantity: 1,
                subtotal: "150.00",
                platformFee: "12.00",
                total: "162.00",
                status: "completed",
                paymentStatus: "succeeded",
                createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
            }
        ];

        await db.insert(orders).values(sales as any);

        console.log("✅ Transactions seeded successfully!");
    } catch (error) {
        console.error("Error seeding transactions:", error);
    } finally {
        process.exit(0);
    }
}

seedTransactions();
