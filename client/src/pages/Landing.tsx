import { MessageSquare, Code, DollarSign, TrendingUp, Check, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Primes SMS</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              WhatsApp Business API 
              <span className="text-blue-600"> Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Send bulk WhatsApp messages, manage templates, and integrate with your apps using our developer-friendly platform
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700">Credit-based pricing</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700">No hidden fees</span>
              </div>
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-gray-700">Easy integration</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to scale your messaging
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools and APIs designed for developers and businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Developer Friendly</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  RESTful API with comprehensive documentation and easy integration
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    RESTful API
                  </li>
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Comprehensive docs
                  </li>
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Easy integration
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Transparent Pricing</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Pay-per-use credits with no monthly fees or hidden charges
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Pay-per-use credits
                  </li>
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    No monthly fees
                  </li>
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Real-time tracking
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Powerful Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Bulk campaigns, template management, and detailed analytics
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Bulk campaigns
                  </li>
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Template management
                  </li>
                  <li className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Detailed analytics
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              No setup fees. No monthly charges. Pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  1,000 <span className="text-lg text-gray-600 font-normal">credits</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">$10</div>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-4">Get Started</Button>
                <p className="text-sm text-gray-600 text-center">Perfect for small businesses</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Growth</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  5,000 <span className="text-lg text-gray-600 font-normal">credits</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">$45</div>
                <div className="text-sm text-green-600 font-semibold">Save $5</div>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-4">Get Started</Button>
                <p className="text-sm text-gray-600 text-center">Ideal for growing companies</p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-blue-600 mt-4">
                  15,000 <span className="text-lg text-gray-600 font-normal">credits</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900">$120</div>
                <div className="text-sm text-green-600 font-semibold">Save $30</div>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-4">Get Started</Button>
                <p className="text-sm text-gray-600 text-center">For high-volume messaging</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-4">
              <Shield className="inline h-5 w-5 mr-2" />
              No setup fees • No monthly charges • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MessageSquare className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">Primes SMS</span>
              </div>
              <p className="text-gray-400">
                WhatsApp Business API made simple for developers and businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; 2024 Primes SMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}