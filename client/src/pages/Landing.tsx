import { MessageSquare, Code, Check, ArrowRight, Shield, Zap, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Prime SMS</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 font-medium">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-blue-600">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              WhatsApp Business API
              <span className="text-blue-600 block">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Send bulk WhatsApp messages, manage templates, and integrate with your applications using our reliable, developer-friendly platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3">
                View Documentation
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                No setup fees
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                Pay per message
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                24/7 support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for businesses of all sizes, from startups to enterprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Bulk Messaging
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Send thousands of messages instantly with our high-performance API. Perfect for marketing campaigns and notifications.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Template Management
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Create, edit, and manage WhatsApp message templates with media support. Easy approval process included.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Developer API
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  RESTful API with comprehensive documentation. Easy integration with your existing applications and workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Pay only for what you use. No hidden fees or monthly commitments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border border-gray-200 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Starter</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mb-2">$10</div>
                <p className="text-gray-600">1,000 messages</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
                <p className="text-sm text-gray-600 text-center">Perfect for small businesses</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600 bg-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Business</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mb-2">$45</div>
                <p className="text-gray-600">5,000 messages</p>
                <p className="text-sm text-green-600 font-semibold">Save $5</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
                <p className="text-sm text-gray-600 text-center">Great for growing businesses</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mb-2">$120</div>
                <p className="text-gray-600">15,000 messages</p>
                <p className="text-sm text-green-600 font-semibold">Save $30</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
                <p className="text-sm text-gray-600 text-center">For high-volume messaging</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 flex items-center justify-center">
              <Shield className="h-5 w-5 mr-2" />
              No setup fees • No monthly charges • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Prime SMS</span>
            </div>
            <p className="text-gray-600">© 2024 Prime SMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}