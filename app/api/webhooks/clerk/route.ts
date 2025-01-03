import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { CreateOrUpdateUser } from '@/utils/db/actions';

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    console.error('Error: SIGNING_SECRET is missing');
    throw new Error('Please add SIGNING_SECRET from Clerk Dashboard to .env or .env.local');
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Error: Missing Svix headers');
    return new Response('Error: Missing Svix headers', { status: 400 });
  }

  const rawBody = await req.text();
  console.log('Raw Body:', rawBody);

  try {
    const evt = wh.verify(rawBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;

    console.log('Verified Webhook Event:', evt);
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      console.log('User ID:', evt.data.id);
      const { id, email_addresses, first_name, last_name } = evt.data
      const email = email_addresses[0]?.email_address
      const name = `${first_name}  ${last_name}`
      

      if (email) {
     
        try {
          await CreateOrUpdateUser(id, email, name);

          console.log(`User ${id} created/updated successfully`);
        } catch (error) {
          console.error("Error creating/updating user:", error);
          return new Response("Error processing user data", { status: 500 });
        }
      }
    }
    return new Response('Webhook received', { status: 200 });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification error', { status: 400 });
  }
}
