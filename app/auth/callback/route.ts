import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/profile'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user && data.user.email) {
      // Extract LinkedIn profile data from user metadata
      const userMetadata = data.user.user_metadata || {}
      const email = data.user.email

      // Check if participant already exists
      const { data: existingParticipant } = await supabase
        .from('participants')
        .select('id, avatar_url, headline, location')
        .eq('email', email)
        .single()

      if (existingParticipant) {
        // Update existing participant with LinkedIn data only if not already set
        const updateData: any = {
          raw_user_metadata: userMetadata,
        }

        // Only update if fields are empty
        if (!existingParticipant.avatar_url && userMetadata.picture) {
          updateData.avatar_url = userMetadata.picture
        }
        if (!existingParticipant.headline && userMetadata.headline) {
          updateData.headline = userMetadata.headline
        }
        if (!existingParticipant.location && userMetadata.locale) {
          updateData.location = userMetadata.locale
        }

        await supabase
          .from('participants')
          .update(updateData)
          .eq('email', email)
      } else {
        // Create new participant with LinkedIn data
        await supabase
          .from('participants')
          .insert({
            email: email,
            name: userMetadata.name || userMetadata.full_name || email.split('@')[0],
            avatar_url: userMetadata.picture || null,
            headline: userMetadata.headline || null,
            location: userMetadata.locale || null,
            linkedin_url: userMetadata.profile_url || '',
            website_url: '',
            bio: '',
            address: '',
            expertise_level: 'Mid',
            wishlist: [],
            raw_user_metadata: userMetadata,
          })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    // Log error for debugging
    console.error('Auth callback error:', error)
  }

  // If there's an error or no code, redirect to home with error message
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
