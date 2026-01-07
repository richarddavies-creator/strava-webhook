// Strava webhook receiver
const VERIFY_TOKEN = 'BELIEVE_CHALLENGE_2026';
const WIX_ENDPOINT = 'https://www.believe-hk.com/_functions/processActivity';

export default async function handler(req, res) {
  
  // Handle Strava webhook verification challenge
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    console.log('Webhook verification request:', { mode, token });
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return res.status(200).json({ 'hub.challenge': challenge });
    } else {
      console.error('Webhook verification failed');
      return res.status(403).json({ error: 'Verification failed' });
    }
  }
  
  // Handle Strava webhook events
  if (req.method === 'POST') {
    try {
      const event = req.body;
      
      console.log('Received webhook event:', JSON.stringify(event, null, 2));
      
      // Only process new activities
      if (event.aspect_type === 'create' && event.object_type === 'activity') {
        console.log('Processing new activity:', event.object_id);
        
        // Forward to Wix backend
        const wixResponse = await fetch(WIX_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stravaAthleteId: event.owner_id.toString(),
            activityId: event.object_id.toString()
          })
        });
        
        const wixResult = await wixResponse.json();
        console.log('Wix processing result:', wixResult);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Activity forwarded to Wix',
          wixResult 
        });
      }
      
      // Log but ignore other event types
      console.log('Ignoring event type:', event.aspect_type);
      return res.status(200).json({ 
        success: true, 
        message: 'Event logged but not processed' 
      });
      
    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ 
        error: 'Processing failed', 
        details: error.message 
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}