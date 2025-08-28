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
      <Preview>Magic Link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h2}>Magic Link</Heading>
          
          <Text style={text}>
            Follow this link to login:
          </Text>
          
          <Text style={text}>
            <Link href={confirmationUrl} style={link}>Log In</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  fontFamily: 'Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  maxWidth: '600px',
  padding: '20px',
}

const h2 = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
}

const text = {
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px 0',
}

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
}