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
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: MagicLinkEmailProps) => {
  const confirmationUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

  return (
    <Html>
      <Head />
      <Preview>ANIME.TOKEN Magic Link - Welcome to the community!</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={logoContainer}>
            <Img
              src="https://animedottoken.com/icon-512.png"
              alt="ANIME.TOKEN Logo"
              width="48"
              height="48"
              style={logo}
            />
            <Heading style={heading}>ANIME.TOKEN Magic Link</Heading>
          </div>
          
          <Text style={welcomeText}>
            Welcome to the community! Click below to securely log in to your ANIME.TOKEN account.
          </Text>
          
          <div style={buttonContainer}>
            <Link href={confirmationUrl} style={button}>
              Log In
            </Link>
          </div>
          
          <Text style={infoText}>
            This link is valid for a limited time and can only be used once.
          </Text>
          
          <Text style={footerText}>
            If you didn't request this, you can safely ignore this email.<br />
            Need help? <Link href="https://discord.gg/jqxCbvZvn7" style={supportLink}>Join our Discord support</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
  backgroundColor: '#ffffff',
  color: '#18181b',
}

const container = {
  margin: '0 auto',
  maxWidth: '420px',
  padding: '32px 20px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
}

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const logo = {
  borderRadius: '8px',
  marginBottom: '12px',
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  color: '#7c3aed',
  letterSpacing: '-0.5px',
}

const welcomeText = {
  fontSize: '17.28px', // 1.08em equivalent
  lineHeight: '24px',
  margin: '0 0 18px 0',
  color: '#18181b',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '0 0 22px 0',
}

const button = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  textDecoration: 'none',
  padding: '12px 32px',
  borderRadius: '8px',
  fontWeight: 'bold',
  fontSize: '17.6px', // 1.1em equivalent
  display: 'inline-block',
  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.2)',
}

const infoText = {
  fontSize: '15.52px', // 0.97em equivalent
  margin: '0 0 6px 0',
  color: '#6b7280',
}

const footerText = {
  fontSize: '14.88px', // 0.93em equivalent
  color: '#a1a1aa',
  margin: '0',
}

const supportLink = {
  color: '#7c3aed',
  textDecoration: 'underline',
}