import { hash } from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  try {
    // Create admin user
    const adminPassword = await hash("adminPassword123", 10)
    const admin = await prisma.user.upsert({
      where: { email: "admin@hostelhub.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@hostelhub.com",
        password: adminPassword,
        role: "SUPER_ADMIN",
      },
    })
    console.log("Created admin user:", admin.email)

    // Create hostel admin
    const hostelAdminPassword = await hash("hostelAdmin123", 10)
    const hostelAdmin = await prisma.user.upsert({
      where: { email: "hostel_admin@hostelhub.com" },
      update: {},
      create: {
        name: "Hostel Admin",
        email: "hostel_admin@hostelhub.com",
        password: hostelAdminPassword,
        role: "HOSTEL_ADMIN",
      },
    })
    console.log("Created hostel admin:", hostelAdmin.email)

    // Create test student
    const studentPassword = await hash("student123", 10)
    const student = await prisma.user.upsert({
      where: { email: "student@example.com" },
      update: {},
      create: {
        name: "Test Student",
        email: "student@example.com",
        password: studentPassword,
        role: "STUDENT",
      },
    })
    console.log("Created test student:", student.email)

    // Create sample hostel
    const hostel = await prisma.hostel.create({
      data: {
        name: "University Hostel",
        description: "A comfortable hostel near the university campus",
        address: "123 University Street",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA",
        latitude: 40.7128,
        longitude: -74.006,
        amenities: ["Free Wi-Fi", "Laundry", "Gym", "Study Room"],
        admins: {
          connect: { id: hostelAdmin.id },
        },
      },
    })
    console.log("Created sample hostel:", hostel.name)

    // Create sample rooms
    const roomTypes = ["SINGLE", "DOUBLE", "TRIPLE"]
    const roomPrices = [450, 350, 300]
    const roomCapacities = [1, 2, 3]

    for (let i = 0; i < 10; i++) {
      const typeIndex = i % 3
      const room = await prisma.room.create({
        data: {
          roomNumber: `R${i + 101}`,
          roomType: roomTypes[typeIndex] as any,
          description: `A ${roomTypes[typeIndex].toLowerCase()} room with basic amenities`,
          price: roomPrices[typeIndex],
          capacity: roomCapacities[typeIndex],
          status: i % 4 !== 0 ? "AVAILABLE" : "OCCUPIED", // Some rooms are unavailable
          amenities: ["Bed", "Desk", "Wardrobe", "Wi-Fi"],
          hostelId: hostel.id,
        },
      })
      console.log("Created room:", room.roomNumber)
    }

    // Create a booking for the student
    const room = await prisma.room.findFirst({
      where: {
        hostelId: hostel.id,
        status: "AVAILABLE",
      },
    })

    if (room) {
      const booking = await prisma.booking.create({
        data: {
          checkIn: new Date(),
          checkOut: new Date(new Date().setMonth(new Date().getMonth() + 6)),
          status: "CONFIRMED",
          totalPrice: room.price * 6, // 6 months
          userId: student.id,
          roomId: room.id,
        },
      })
      console.log("Created booking for student:", booking.id)

      // Create a payment for the booking
      const payment = await prisma.payment.create({
        data: {
          amount: room.price, // First month payment
          status: "COMPLETED",
          method: "Credit Card",
          bookingId: booking.id,
        },
      })
      console.log("Created payment for booking:", payment.id)

      // Mark room as unavailable
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "OCCUPIED" },
      })
      console.log("Updated room availability")

      // Create a review
      const review = await prisma.review.create({
        data: {
          rating: 4,
          comment: "Great hostel with good amenities. Close to campus and affordable.",
          userId: student.id,
          hostelId: hostel.id,
        },
      })
      console.log("Created review:", review.id)
    }

    console.log("Database seeding completed successfully")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
