import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface MagicLinkEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const MagicLinkEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: MagicLinkEmailProps) => {
  // Dynamic content based on email action type
  const getContent = (actionType: string) => {
    switch (actionType) {
      case 'signup':
        return {
          preview: 'Welcome to ANIME.TOKEN - Verify your account',
          title: 'Welcome to ANIME.TOKEN! 🎌',
          message: 'Thank you for joining the ANIME.TOKEN community! Click the button below to verify your account and start your journey.',
          buttonText: 'Verify Account',
        }
      case 'recovery':
        return {
          preview: 'Reset your ANIME.TOKEN password',
          title: 'Reset Your Password 🔐',
          message: 'We received a request to reset your ANIME.TOKEN password. Click the button below to create a new password.',
          buttonText: 'Reset Password',
        }
      case 'email_change':
        return {
          preview: 'Confirm your new email for ANIME.TOKEN',
          title: 'Confirm Email Change 📧',
          message: 'Please confirm your new email address for your ANIME.TOKEN account by clicking the button below.',
          buttonText: 'Confirm Email',
        }
      default:
        return {
          preview: 'Your magic link to ANIME.TOKEN',
          title: 'Sign in to ANIME.TOKEN 🔗',
          message: 'Click the button below to sign in to your ANIME.TOKEN account.',
          buttonText: 'Sign In',
        }
    }
  }

  const content = getContent(email_action_type)

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={logoContainer}>
            <Img
              src="https://073d74a6-99d5-42cc-8d2e-4144164f2d85.sandbox.lovable.dev/lovable-uploads/77cf628c-3ad8-4364-b7d8-4c7e381fe6be.png"
              width="32"
              height="32"
              alt="ANIME Token"
              style={logo}
            />
            <Heading style={h1}>ANIME.TOKEN</Heading>
          </div>
          
          <Heading style={h2}>{content.title}</Heading>
          
          <Text style={text}>
            {content.message}
          </Text>
          
          <div style={buttonContainer}>
            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
              style={button}
            >
              {content.buttonText}
            </Link>
          </div>
          
          <Text style={altText}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={linkText}>
            {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          </Text>
          
          <Text style={codeText}>
            You can also use this temporary login code:
          </Text>
          <div style={codeContainer}>
            <Text style={code}>{token}</Text>
          </div>
          
          <Text style={footer}>
            If you didn't request this email, you can safely ignore it.
          </Text>
          
          <Text style={signature}>
            Best regards,<br />
            The ANIME.TOKEN Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '20px 0',
}

const container = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '8px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px',
}

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '32px',
  gap: '12px',
}

const logo = {
  borderRadius: '4px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
  textAlign: 'center' as const,
}

const altText = {
  color: '#a3a3a3',
  fontSize: '14px',
  margin: '24px 0 8px 0',
  textAlign: 'center' as const,
}

const linkText = {
  color: '#8B5CF6',
  fontSize: '12px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
}

const codeText = {
  color: '#e5e5e5',
  fontSize: '14px',
  margin: '24px 0 8px 0',
  textAlign: 'center' as const,
}

const codeContainer = {
  backgroundColor: '#2a2a2a',
  border: '1px solid #404040',
  borderRadius: '6px',
  margin: '0 0 24px 0',
  padding: '16px',
  textAlign: 'center' as const,
}

const code = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  margin: '0',
}

const footer = {
  color: '#a3a3a3',
  fontSize: '12px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const signature = {
  color: '#e5e5e5',
  fontSize: '14px',
  margin: '24px 0 0 0',
  textAlign: 'center' as const,
}