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

interface NewsletterConfirmEmailProps {
  confirmUrl: string
  email: string
}

export const NewsletterConfirmEmail = ({
  confirmUrl,
  email,
}: NewsletterConfirmEmailProps) => (
  <Html>
    <Head />
    <Preview>Please confirm your newsletter subscription</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your subscription</Heading>
        <Text style={text}>
          Hi there! You've requested to subscribe to our newsletter with the email address {email}.
        </Text>
        <Text style={text}>
          To complete your subscription, please click the button below:
        </Text>
        <Link
          href={confirmUrl}
          target="_blank"
          style={button}
        >
          Confirm Subscription
        </Link>
        <Text style={footer}>
          If you didn't request this subscription, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default NewsletterConfirmEmail

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
  backgroundColor: '#28a745',
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

const footer = {
  color: '#6c757d',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '32px',
  textAlign: 'center' as const,
}