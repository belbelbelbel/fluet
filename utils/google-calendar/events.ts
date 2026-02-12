/**
 * Google Calendar Event Creation
 * Creates calendar events for scheduled posts that need manual posting
 */

interface CalendarEventData {
  title: string;
  description: string;
  scheduledFor: Date;
  platform: string;
  content: string;
  appLink: string;
}

/**
 * Create a Google Calendar event for a scheduled post
 */
export async function createCalendarEvent(
  accessToken: string,
  post: CalendarEventData
): Promise<{
  id: string;
  htmlLink: string;
  summary: string;
}> {
  const event = {
    summary: `📱 ${post.platform.charAt(0).toUpperCase() + post.platform.slice(1)} Post: ${post.title.substring(0, 50)}`,
    description: `Platform: ${post.platform}\n\nContent:\n${post.content}\n\n---\n\nClick here to open in Fluet: ${post.appLink}\n\nThis is an automated reminder from Fluet.`,
    start: {
      dateTime: post.scheduledFor.toISOString(),
      timeZone: 'Africa/Lagos', // Nigerian timezone
    },
    end: {
      dateTime: new Date(post.scheduledFor.getTime() + 15 * 60 * 1000).toISOString(), // 15 min event
      timeZone: 'Africa/Lagos',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 30 },
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 5 },
      ],
    },
    colorId: getPlatformColor(post.platform),
    location: 'Fluet Dashboard',
    source: {
      title: 'Fluet',
      url: post.appLink,
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create calendar event: ${error}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    htmlLink: data.htmlLink,
    summary: data.summary,
  };
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete calendar event: ${error}`);
  }
}

/**
 * Get platform color for calendar events
 */
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: '11', // Pink
    linkedin: '9',   // Blue
    twitter: '1',    // Lavender
    tiktok: '10',    // Green
    youtube: '6',    // Orange
  };
  return colors[platform.toLowerCase()] || '1';
}

/**
 * Verify Google Calendar token is valid
 */
export async function verifyGoogleCalendarToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
