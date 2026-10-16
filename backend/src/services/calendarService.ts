import { cache } from './cacheService';
import {
  getSlackUserEmailMap,
  broadcastMeetingCallToUsers,
  postSlackRaw,
  getSlackChannel,
  getChannelHumanMembers,
} from './slackService';

/**
 * Check upcoming meetings in Google Calendar and trigger targeted Slack calls
 */
export async function checkGoogleCalendarMeetings(): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!calendarId || !apiKey) {
    return;
  }

  try {
    const now = new Date();
    const timeMin = now.toISOString();
    // Check meetings starting in the next 60 seconds
    const timeMax = new Date(now.getTime() + 60 * 1000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 403 || res.status === 400) {
        console.warn(`[GCal] API request failed with status: ${res.status}. Ensure Google Calendar API is enabled for your API key and the calendar is public.`);
      }
      return;
    }

    const data: any = await res.json().catch(() => ({}));
    const events: any[] = data.items || [];

    if (events.length === 0) return;

    let slackEmailMap: Map<string, string> | null = null;

    for (const event of events) {
      const cacheKey = `gcal:triggered:${event.id}`;
      const alreadyTriggered = await cache.get<boolean>(cacheKey);
      if (alreadyTriggered) continue;

      await cache.set(cacheKey, true, 60 * 120);

      console.log(`[GCal] Detected upcoming meeting: ${event.summary || 'Untitled'} (ID: ${event.id})`);

      const meetingTitle = event.summary || 'Scheduled Team Meeting';
      const meetingUrl = event.hangoutLink || event.location || process.env.SLACK_MEETING_URL || 'https://meet.google.com/tfg-tfdx-ryu';

      // 1. Resolve attendees email addresses
      const attendees: any[] = event.attendees || [];
      const attendeeEmails = attendees
        .map((a: any) => a.email)
        .filter(Boolean)
        .map((e: string) => e.toLowerCase().trim());

      const targetSlackUserIds: string[] = [];

      // 2. Map attendee emails to Slack User IDs
      if (attendeeEmails.length > 0) {
        if (!slackEmailMap) {
          slackEmailMap = await getSlackUserEmailMap();
        }

        for (const email of attendeeEmails) {
          const slackId = slackEmailMap.get(email);
          if (slackId) {
            targetSlackUserIds.push(slackId);
          }
        }
      }

      // 3. Resolve Admin Slack User ID (the organizer/calendar owner)
      if (!slackEmailMap) {
        slackEmailMap = await getSlackUserEmailMap();
      }
      const adminSlackId = slackEmailMap.get(calendarId.toLowerCase().trim());
      if (adminSlackId && !targetSlackUserIds.includes(adminSlackId)) {
        targetSlackUserIds.push(adminSlackId);
      }

      // 4. Trigger target broadcast DMs
      const defaultChannel = getSlackChannel('customers') || '';

      if (targetSlackUserIds.length > 0) {
        console.log(`[GCal] Triggering targeted DM calls for ${targetSlackUserIds.length} resolved invitee(s)`);
        await broadcastMeetingCallToUsers(targetSlackUserIds, 'Google Calendar', meetingTitle, meetingUrl);

        if (defaultChannel) {
          await postSlackRaw(defaultChannel, {
            text: `🗓️ *Meeting starting:* "${meetingTitle}" • Joining links sent to matching invitees.`,
          }).catch(() => {});
        }
      } else {
        // Fallback: If no specific invitees found, broadcast to everyone in the default channel
        console.log('[GCal] No specific invitees matched. Broadcasting invitation DMs to all channel members.');
        
        if (defaultChannel) {
          const channelMembers = await getChannelHumanMembers(defaultChannel);
          if (channelMembers.length > 0) {
            await broadcastMeetingCallToUsers(channelMembers, 'Google Calendar', meetingTitle, meetingUrl);
            await postSlackRaw(defaultChannel, {
              text: `🗓️ *Meeting starting:* "${meetingTitle}" • Joining links sent to all members.`,
            }).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.error('[GCal] Error checking upcoming calendar events:', err);
  }
}
