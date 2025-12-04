import { db } from '../server/db';
import { bookings, escrowTransactions } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function approveBooking() {
  const bookingNumber = 'BKMIQS0LR3WG0V';
  
  const [booking] = await db.select().from(bookings).where(eq(bookings.bookingNumber, bookingNumber)).limit(1);
  
  if (!booking) {
    console.log('Booking not found:', bookingNumber);
    process.exit(1);
  }
  
  console.log('Found booking:', booking.id, 'Status:', booking.status);
  
  // Update booking status to confirmed
  await db.update(bookings)
    .set({ 
      status: 'confirmed',
      confirmedStartTime: booking.requestedStartTime,
      confirmedEndTime: booking.requestedEndTime
    })
    .where(eq(bookings.id, booking.id));
  
  // Update escrow status if exists
  await db.update(escrowTransactions)
    .set({ status: 'held' })
    .where(eq(escrowTransactions.bookingId, booking.id));
  
  console.log('✅ Booking approved and confirmed!');
  console.log('📍 Success page URL: http://localhost:5000/booking-success?booking=' + booking.id);
  
  process.exit(0);
}

approveBooking();
