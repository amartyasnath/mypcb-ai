import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Search, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Navigation */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">myPCB AI</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          </nav>
          <div className="flex gap-4">
            <Link to="/app">
              <Button>Launch Workspace</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-4 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8aa89710_1px,transparent_1px),linear-gradient(to_bottom,#8aa89710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold font-heading mb-6 tracking-tight">
              Intelligent sourcing for your PCB designs.
            </h1>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
              Stop scouring datasheets manually. Let AI find the exact microcontrollers, passives, and components you need, matching footprints and parameters instantly.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link to="/app">
              <Button size="lg" className="h-14 px-8 text-lg font-medium group">
                Open Workspace <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-medium bg-background/50 backdrop-blur-sm">
                Explore Features
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-secondary/50 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-heading mb-4">Engineered for Hardware Teams</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Designed to integrate seamlessly into your engineering workflow.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-background border-border/50 text-card-foreground">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Search className="w-6 h-6" />
                </div>
                <CardTitle className="font-heading text-xl">Parametric Search via AI</CardTitle>
                <CardDescription className="text-muted-foreground">Describe your circuit needs in plain text. Get specific part numbers that meet those electrical parameters.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border/50 text-card-foreground">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle className="font-heading text-xl">Real-Time Alternative Sourcing</CardTitle>
                <CardDescription className="text-muted-foreground">Component out of stock? Instantly find pin-for-pin replacements or functionally identical alternatives.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-background border-border/50 text-card-foreground">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Cpu className="w-6 h-6" />
                </div>
                <CardTitle className="font-heading text-xl">Export Ready BOMs</CardTitle>
                <CardDescription className="text-muted-foreground">Download your selected components as a formatted Excel (.xlsx) spreadsheet, ready to import into your EDA tool.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-32 px-4 border-t border-border/50 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-8 relative border border-border/50">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-4xl font-bold font-heading mb-6 tracking-tight">Security & Privacy</h2>
          <p className="text-lg text-muted-foreground mb-8 font-sans leading-relaxed">
            Your proprietary schematics and hardware designs are your intellectual property, and we treat them that way. All traffic is encrypted in transit with TLS, your chat history is private to your account, and we never sell your prompts or use them to train our own models. Our infrastructure runs on Google Cloud.
          </p>
          <div className="flex justify-center flex-wrap gap-x-12 gap-y-4">
             <div className="flex items-center gap-2 text-sm font-medium text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> TLS encryption in transit</div>
             <div className="flex items-center gap-2 text-sm font-medium text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> History private to your account</div>
             <div className="flex items-center gap-2 text-sm font-medium text-foreground"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Never used to train our models</div>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            Prompts are processed by the Anthropic Claude API to generate recommendations. See our{' '}
            <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> for exactly how data is handled.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Cpu className="w-5 h-5 text-primary" />
            <span className="font-heading font-medium tracking-tight">myPCB AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/app" className="hover:text-foreground transition-colors">App</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
