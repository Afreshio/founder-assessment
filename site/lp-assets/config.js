// Launch settings for every landing page. See docs/launch-checklist.md for where each value comes from.
export const CONFIG = {
  // Meta Pixel (dataset) ID from Events Manager. Empty means no pixel loads; events still reach
  // window.dataLayer and window.__afreshEvents so the pages can be tested before launch.
  metaPixelId: '',

  // HubSpot form that receives leads. 247393378 is the Afresh HubSpot portal.
  hubspot: {
    portalId: '247393378',
    formGuid: '',
    endpoint: 'https://api.hsforms.com/submissions/v3/integration/submit',
    // Lead key -> HubSpot contact property. Every property listed must exist in HubSpot and be on
    // the form (hidden fields are fine) or HubSpot rejects the submission. Add the extras from the
    // checklist once those properties exist.
    fieldMap: {
      email: 'email',
      firstName: 'firstname',
    },
  },

  // Optional second destination (Zapier, Make, or an /api route). Receives the whole lead as JSON.
  webhookUrl: '',

  // Calendly event for the free session. A dedicated "Unblock Session" event type makes ad
  // bookings easy to count; until one exists, this is the existing 30 minute Zoom meeting.
  bookingUrl: 'https://calendly.com/douglas-stevenson/meeting',
};
