import { Pool } from 'pg';
import bcrypt from 'bcrypt';

/**
 * Seed script — populates database with rich sample data for development.
 * Creates: 1 admin, 3 regular users, 8 events (varied categories), mixed bookings.
 * Idempotent: clears existing data before inserting.
 */
async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://eventos_user:eventos_password@localhost:5433/eventbooking',
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Starting seed...');

    await client.query('BEGIN');

    // Clear existing data (order matters due to FK constraints)
    await client.query('DELETE FROM event_os_bookings');
    await client.query('DELETE FROM event_os_refresh_tokens');
    await client.query('DELETE FROM event_os_events');
    await client.query('DELETE FROM event_os_users');

    // Hash passwords
    const adminHash = await bcrypt.hash('Admin@1234', 12);
    const userHash = await bcrypt.hash('User@1234', 12);

    // Create admin user
    const adminRes = await client.query(
      `INSERT INTO event_os_users (email, password_hash, name, role)
       VALUES ('admin@eventos.dev', $1, 'Admin User', 'admin')
       RETURNING id`,
      [adminHash]
    );
    const adminId = adminRes.rows[0].id;

    // Create regular users
    const user1Res = await client.query(
      `INSERT INTO event_os_users (email, password_hash, name)
       VALUES ('alice@example.com', $1, 'Alice Johnson')
       RETURNING id`,
      [userHash]
    );
    const user1Id = user1Res.rows[0].id;

    const user2Res = await client.query(
      `INSERT INTO event_os_users (email, password_hash, name)
       VALUES ('bob@example.com', $1, 'Bob Smith')
       RETURNING id`,
      [userHash]
    );
    const user2Id = user2Res.rows[0].id;

    const user3Res = await client.query(
      `INSERT INTO event_os_users (email, password_hash, name)
       VALUES ('charlie@example.com', $1, 'Charlie Brown')
       RETURNING id`,
      [userHash]
    );
    const user3Id = user3Res.rows[0].id;

    console.log('✅ Users created');

    // Generate a generic layout
    const getLayout = (totalSeats: number) => {
      const cols = Math.min(20, totalSeats);
      const rows = Math.ceil(totalSeats / cols);
      return { rows, cols };
    };

    // Create 8 events with varied categories
    const events = [
      {
        name: 'Dev Summit 2026',
        description: 'A full-day developer conference featuring talks on cutting-edge technologies, hands-on workshops, and networking opportunities with industry leaders. Topics include AI/ML, cloud architecture, system design, and modern frontend frameworks. Keynote speakers from Google, Microsoft, and Amazon will share their insights on the future of software engineering.',
        venue: 'IIIT Naya Raipur, Chhattisgarh',
        startsAt: '2026-08-15T09:00:00Z',
        endsAt: '2026-08-15T18:00:00Z',
        totalSeats: 200,
        priceCents: 50000,
        category: 'conference',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['A1', 'A2'], // Alice
      },
      {
        name: 'React Workshop: Advanced Patterns',
        description: 'Deep dive into React 19 features including Server Components, use() hook, Actions, and concurrent rendering patterns. Build a production-grade app from scratch with TypeScript, Zustand for state management, and TanStack Query for data fetching. Bring your laptop — this is 100% hands-on.',
        venue: 'TechHub Coworking, Bangalore',
        startsAt: '2025-07-10T10:00:00Z',
        endsAt: '2025-07-10T16:00:00Z',
        totalSeats: 50,
        priceCents: 0,
        category: 'workshop',
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['B5'], // Alice
      },
      {
        name: 'AI/ML Hackathon 2026',
        description: '48-hour hackathon focused on building AI-powered solutions for real-world problems. Cash prizes worth ₹5,00,000. Teams of 2-4 members. Mentorship from engineers at Google DeepMind, Microsoft Research, and Amazon Science. Categories include NLP, Computer Vision, and Generative AI.',
        venue: 'IIT Delhi, New Delhi',
        startsAt: '2026-09-20T08:00:00Z',
        endsAt: '2026-09-22T08:00:00Z',
        totalSeats: 300,
        priceCents: 25000,
        category: 'hackathon',
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['C1', 'C2', 'C3'], // Bob
      },
      {
        name: 'Cloud Architecture Masterclass',
        description: 'Learn to design scalable, resilient cloud architectures on AWS. Covers microservices decomposition, serverless patterns, container orchestration with ECS/EKS, infrastructure as code with Terraform, and observability with CloudWatch. Taught by a 3x AWS Certified Solutions Architect.',
        venue: 'Google for Startups Campus, Hyderabad',
        startsAt: '2025-10-05T09:00:00Z',
        endsAt: '2025-10-05T17:00:00Z',
        totalSeats: 100,
        priceCents: 75000,
        category: 'workshop',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['M1', 'M2'],
      },
      {
        name: 'Startup Founders Meetup',
        description: 'Monthly meetup for startup founders to share war stories, pitch new ideas, and connect with angel investors and VCs. Featured speaker: Zerodha co-founder on "Building Products for India at Scale." Lightning talks, pizza, and networking afterwards.',
        venue: 'WeWork Galaxy, Bangalore',
        startsAt: '2026-07-25T18:00:00Z',
        endsAt: '2026-07-25T21:00:00Z',
        totalSeats: 80,
        priceCents: 0,
        category: 'meetup',
        imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['D1', 'D2', 'D3', 'D4', 'D5'], // Charlie
      },
      {
        name: 'TypeScript Deep Dive',
        description: 'Master advanced TypeScript patterns: conditional types, template literal types, mapped types, discriminated unions, branded types, and type-safe API design. Learn how to make TypeScript work for you, not against you. Includes live coding challenges and Q&A with the instructor.',
        venue: 'Online (Zoom Webinar)',
        startsAt: '2025-08-05T14:00:00Z',
        endsAt: '2025-08-05T17:00:00Z',
        totalSeats: 500,
        priceCents: 0,
        category: 'webinar',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['E1', 'E2', 'E3'], // Alice
      },
      {
        name: 'DevOps India Conference 2026',
        description: 'India\'s premier DevOps conference. Two full days of talks, panels, and workshops covering CI/CD pipelines, GitOps, platform engineering, Kubernetes in production, SRE practices, and security automation. 30+ speakers from Netflix, Shopify, Atlassian, and more.',
        venue: 'Pragati Maidan Convention Centre, Delhi',
        startsAt: '2026-11-12T09:00:00Z',
        endsAt: '2026-11-13T18:00:00Z',
        totalSeats: 400,
        priceCents: 150000,
        category: 'conference',
        imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['F1', 'F2'], // Bob
      },
      {
        name: 'Build Your First AI Agent – Hackathon',
        description: 'A beginner-friendly, 24-hour hackathon where you\'ll build an AI agent from scratch using LangChain, OpenAI APIs, and vector databases. Mentors will guide you through prompt engineering, RAG, function calling, and deployment. Solo or teams of 2. Prizes for best agent, most creative, and best UI.',
        venue: 'BITS Pilani, Goa Campus',
        startsAt: '2026-09-06T10:00:00Z',
        endsAt: '2026-09-07T10:00:00Z',
        totalSeats: 150,
        priceCents: 10000,
        category: 'hackathon',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        bookedSeats: ['G1'], // Charlie
      },
    ];

    const eventIds: string[] = [];

    for (const event of events) {
      const eventRes = await client.query(
        `INSERT INTO event_os_events (name, description, venue, starts_at, ends_at, total_seats, available_seats, price_cents, category, created_by, seat_layout, booked_seats, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::varchar[], $13)
         RETURNING id`,
        [
          event.name, event.description, event.venue,
          event.startsAt, event.endsAt, event.totalSeats,
          event.totalSeats - event.bookedSeats.length, event.priceCents, event.category, adminId,
          JSON.stringify(getLayout(event.totalSeats)), event.bookedSeats, event.imageUrl
        ]
      );
      eventIds.push(eventRes.rows[0].id);
    }

    console.log('✅ Events created (8 events across 5 categories with seat layouts)');

    // Create bookings
    // Alice: Dev Summit
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 100000, 'confirmed')`,
      [user1Id, eventIds[0], ['A1', 'A2']]
    );

    // Alice: React Workshop
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 0, 'confirmed')`,
      [user1Id, eventIds[1], ['B5']]
    );

    // Alice: TypeScript Webinar
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 45000, 'confirmed')`,
      [user1Id, eventIds[5], ['E1', 'E2', 'E3']]
    );

    // Alice: Cloud Architecture Masterclass
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 150000, 'confirmed')`,
      [user1Id, eventIds[3], ['M1', 'M2']]
    );

    // Bob: AI Hackathon
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 75000, 'confirmed')`,
      [user2Id, eventIds[2], ['C1', 'C2', 'C3']]
    );

    // Bob: Dev Summit (cancelled) -> Doesn't reserve seats in events table
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status, cancelled_at, cancel_reason)
       VALUES ($1, $2, $3::varchar[], 50000, 'cancelled', NOW(), 'Schedule conflict')`,
      [user2Id, eventIds[0], ['X1']]
    );

    // Bob: DevOps Conference
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 300000, 'confirmed')`,
      [user2Id, eventIds[6], ['F1', 'F2']]
    );

    // Charlie: Startup Meetup
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 0, 'confirmed')`,
      [user3Id, eventIds[4], ['D1', 'D2', 'D3', 'D4', 'D5']]
    );

    // Charlie: AI Agent Hackathon
    await client.query(
      `INSERT INTO event_os_bookings (user_id, event_id, seats, total_cents, status)
       VALUES ($1, $2, $3::varchar[], 10000, 'confirmed')`,
      [user3Id, eventIds[7], ['G1']]
    );

    console.log('✅ Bookings created (8 bookings, 1 cancelled)');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('  Admin: admin@eventos.dev / Admin@1234');
    console.log('  User:  alice@example.com / User@1234');
    console.log('  User:  bob@example.com / User@1234');
    console.log('  User:  charlie@example.com / User@1234');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
