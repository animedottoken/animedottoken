import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
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
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Log in with this magic link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome back!</Heading>
        <Text style={text}>
          Click the button below to securely sign in to your account:
        </Text>
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={button}
        >
          Sign in to your account
        </Link>
        <Text style={{ ...text, marginTop: '24px' }}>
          Or copy and paste this temporary login code:
        </Text>
        <code style={code}>{token}</code>
        <Text style={footer}>
          If you didn't request this login link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px 20px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
}

const button = {
  backgroundColor: '#007bff',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '16px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

const code = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '4px',
  color: '#495057',
  display: 'block',
  fontSize: '18px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  padding: '16px',
  textAlign: 'center' as const,
  fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
}

const footer = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
  textAlign: 'center' as const,
}