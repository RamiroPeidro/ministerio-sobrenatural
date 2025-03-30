import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { adminClient } from '@/sanity/lib/adminClient'

async function createSanityUser(
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
) {
  try {
    // Check if user already exists
    const existingUser = await adminClient.fetch(  
      `*[_type == "student" && clerkId == $userId][0]`,
      { userId }
    )

    if (existingUser) {
      console.log('User already exists in Sanity')
      return existingUser
    }

  
    const newUser = await adminClient.create({
      _type: 'student',
      clerkId: userId,
      firstName,
      lastName,
      email
    })

    console.log('Created new user in Sanity:', newUser)
    return newUser
  } catch (error) {
    console.error('Error creating user in Sanity:', error)
    throw error
  }
}

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.SIGNING_SECRET

  if (!SIGNING_SECRET) {
    throw new Error('Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env')
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET)

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing Svix headers' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: WebhookEvent

  // Verify payload with headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Verification error' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Do something with payload
  const { id } = evt.data
  const eventType = evt.type
  console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
  console.log('Webhook payload:', body)

  // Handle user creation in Sanity
  if (eventType === 'user.created') {
    const { id, first_name, last_name, email_addresses, username } = evt.data
    const primaryEmail = email_addresses[0]?.email_address || ''
    
    try {
      await createSanityUser(
        id,
        first_name || username || '',  
        last_name || '',
        primaryEmail
      )
      console.log('Successfully created user in Sanity')
      return new Response(
        JSON.stringify({ success: true, message: 'User created in Sanity' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Error creating user in Sanity' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // Acknowledge other webhook types
  return new Response(
    JSON.stringify({ success: true, message: 'Webhook processed' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}