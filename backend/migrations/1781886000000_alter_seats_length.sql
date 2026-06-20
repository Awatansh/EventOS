ALTER TABLE event_os_events ALTER COLUMN booked_seats TYPE VARCHAR(50)[];
ALTER TABLE event_os_bookings ALTER COLUMN seats TYPE VARCHAR(50)[];
