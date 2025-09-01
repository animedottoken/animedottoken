# ANIME.TOKEN - Decentralized NFT Marketplace

ANIME.TOKEN is a revolutionary Web3 marketplace that brings transparency, security, and community-driven governance to the world of anime NFTs and digital collectibles.

## 🌟 Key Features

- **100% Transparent**: Built on Solana with Metaplex protocols for maximum security
- **Non-Custodial**: You always maintain full control of your assets
- **Community-Driven**: Decentralized governance with token holders
- **Creator-Friendly**: Fair revenue sharing and easy minting tools
- **Mobile-First**: Progressive Web App (PWA) optimized for all devices

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Blockchain**: Solana network with Metaplex protocols
- **Backend**: Supabase for user data and authentication
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Lovable platform with custom domain support

## 🌐 Live Application

**Website**: [https://anime.token](https://anime.token)  
**Repository**: [https://github.com/animedottoken/animedottoken](https://github.com/animedottoken/animedottoken)

## 🔐 Security & Transparency

This project practices **radical transparency** as part of our commitment to security:

- **Open Source**: All frontend code is publicly available
- **Auditable**: Smart contracts use established Metaplex protocols
- **Non-Custodial**: Your wallet, your keys, your assets
- **Reproducible Builds**: Verify deployed code matches source code

For security reports and responsible disclosure, see [SECURITY.md](./SECURITY.md).

## 💼 Environment Variables

This application requires the following environment variables:

```env
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_GITHUB_REPO_URL=https://github.com/animedottoken/animedottoken
```

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/animedottoken/animedottoken.git
cd animedottoken

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

## 🔍 Project Structure

```
src/
├── components/         # Reusable UI components
├── pages/             # Main application pages
├── hooks/             # Custom React hooks
├── contexts/          # React context providers
├── lib/               # Utility functions and helpers
├── types/             # TypeScript type definitions
├── assets/            # Static assets (images, etc.)
└── integrations/      # Third-party service integrations
```

## 🤝 Contributing

We welcome contributions from the community! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🛡️ Security

For security concerns or responsible disclosure of vulnerabilities, please see our [Security Policy](./SECURITY.md).

## 📞 Contact & Community

- **Discord**: [Join our community](https://discord.gg/anime-token)
- **Twitter**: [@animetoken](https://twitter.com/animetoken)
- **Website**: [https://anime.token](https://anime.token)

---

**Built with ❤️ by the ANIME.TOKEN community**

*This project demonstrates the power of decentralized, transparent, and community-driven development in the Web3 space.*