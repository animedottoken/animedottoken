import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SupporterProgram() {
  return (
    <>
      <Helmet>
        <title>ANIME Supporter Program - Earn Exclusive NFTs | ANIME.TOKEN</title>
        <meta name="description" content="Join the ANIME.TOKEN Supporter NFT Program. Earn exclusive recognition as a Founder, Ambassador, or Hodler through measurable contributions to our ecosystem." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          {/* Main Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              The ANIME.TOKEN Supporter NFT Program
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Our ecosystem is powered by three distinct and vital groups. This program outlines the three exclusive NFTs created to recognize and reward each of our most valued community supporters. Find your role, contribute to the mission, and earn your on-chain recognition.
            </p>
          </div>

          {/* Section 1: The ANIME ARMY */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              The ANIME ARMY
            </h2>
            
            <Card className="max-w-2xl mx-auto border-2 hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🥇</div>
                  <h3 className="text-xl font-bold">Role: Founder (Member of the ANIME ARMY)</h3>
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  The strategic commanders of the ANIME ARMY. Founders are the elite members providing foundational, high-impact value. They are the key advisors, builders, and strategists shaping the future of the entire project.
                </p>
                
                <div>
                  <h4 className="font-semibold text-lg mb-4">How to Earn</h4>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    This role is the highest honor and is awarded directly for exceptional contributions that fundamentally advance the project. To be considered, a candidate must proactively contact the team and provide evidence of meeting one of the following measurable targets:
                  </p>
                  
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Partnerships:</span>
                      <span className="text-muted-foreground">Secure a formal, announced partnership with another established project, influencer, or platform.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Project Management:</span>
                      <span className="text-muted-foreground">Successfully manage an official project initiative from proposal to completion (e.g., a marketing campaign, community competition, or content sprint).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Treasury Growth:</span>
                      <span className="text-muted-foreground">Introduce a strategic opportunity that results in a verifiable increase of over 10 ETH (or equivalent) to the project treasury.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">Ecosystem Development:</span>
                      <span className="text-muted-foreground">Deliver a functional tool (e.g., Discord bot, analytics dashboard) that is officially adopted for community use.</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: The Allies & The Foundation */}
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              The Allies & The Foundation
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Ambassador Card */}
              <Card className="border-2 hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🤝</div>
                    <h3 className="text-xl font-bold">Role: Ambassador (External Ally)</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    The external special forces who support the ARMY's mission. Ambassadors are the dedicated content creators and community builders who amplify our message and grow our community's reach across the digital world.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-4">How to Earn</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      This NFT is awarded to creators who proactively contact us with proof of meeting the following measurable content targets:
                    </p>
                    
                    <ul className="space-y-3 text-sm">
                      <li>
                        <span className="font-semibold">On X (Twitter):</span>
                        <span className="text-muted-foreground ml-1">Achieve 250,000+ impressions on ANIME-related content within a 3-month period OR create a single thread that receives over 1,000 likes.</span>
                      </li>
                      <li>
                        <span className="font-semibold">On YouTube / TikTok:</span>
                        <span className="text-muted-foreground ml-1">Create a single video that achieves 100,000+ views OR grow a dedicated channel to 5,000+ followers.</span>
                      </li>
                      <li>
                        <span className="font-semibold">On Discord / Telegram:</span>
                        <span className="text-muted-foreground ml-1">Serve as an official, active community moderator for 3+ consecutive months OR successfully organize 3+ official community events.</span>
                      </li>
                      <li>
                        <span className="font-semibold">On the Web:</span>
                        <span className="text-muted-foreground ml-1">Write and publish a detailed article or guide that receives 10,000+ reads.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Hodler Card */}
              <Card className="border-2 hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold">Role: Hodler (The Financial Backbone)</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    The silent financial backbone of our project. Hodlers are not part of the active ARMY; they do not fight, but they finance the entire operation. Their long-term conviction provides the foundational stability for our ecosystem.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-4">How to Earn</h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      This NFT is not an automated reward. To claim your rank, you must proactively contact the team and provide your wallet address. We will use a blockchain explorer to verify your holding history.
                    </p>
                    
                    <ul className="space-y-3 text-sm">
                      <li>
                        <span className="font-semibold">Gold Hodler:</span>
                        <span className="text-muted-foreground ml-1">Verifiably held $ANIME for 3+ months without selling.</span>
                      </li>
                      <li>
                        <span className="font-semibold">Diamond Hodler:</span>
                        <span className="text-muted-foreground ml-1">Verifiably held $ANIME for 12+ months without selling.</span>
                      </li>
                      <li>
                        <span className="font-semibold">Legend Hodler:</span>
                        <span className="text-muted-foreground ml-1">Verifiably has never sold since their initial acquisition.</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                Ready to Claim Your Role?
              </h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                These NFTs are earned, not sold. If you meet the criteria for a Founder, Ambassador, or Hodler, it's time to make it official. Contact the team on X (Twitter) or Discord with proof of your contributions or holding history to begin the verification process.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="min-w-[180px]"
                  onClick={() => window.open('https://twitter.com/AnimeDotToken', '_blank')}
                >
                  Contact on X (Twitter)
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="min-w-[180px]"
                  onClick={() => window.open('https://discord.gg/your-discord', '_blank')}
                >
                  Join our Discord
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}