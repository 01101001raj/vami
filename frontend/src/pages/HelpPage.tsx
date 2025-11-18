import { useState } from 'react';
import { HelpCircle, Book, MessageCircle, Mail, Phone, Search, ChevronDown, ChevronUp, Video, FileText, ExternalLink } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: 'How do I set up my AI agent?',
    answer: 'To set up your AI agent, navigate to Settings > Agent Configuration. Here you can customize your agent\'s name, voice, personality, and knowledge base. Upload relevant documents and configure call scripts to enhance your agent\'s performance.',
    category: 'Getting Started'
  },
  {
    id: 2,
    question: 'What are the different pricing plans?',
    answer: 'We offer three plans: Free (100 minutes/month), Pro ($49/month with 1000 minutes), and Enterprise (custom pricing with unlimited minutes). You can upgrade or downgrade at any time from the Billing page.',
    category: 'Billing'
  },
  {
    id: 3,
    question: 'How do I upload knowledge to my agent?',
    answer: 'Go to Dashboard and click on "Upload Knowledge". You can upload PDFs, Word documents, or text files. The AI will process and learn from these documents to better handle customer interactions.',
    category: 'Agent Setup'
  },
  {
    id: 4,
    question: 'Can I integrate with my calendar?',
    answer: 'Yes! Navigate to Calendar page and click "Connect Calendar". We support Google Calendar, Outlook, and Apple Calendar integrations. Your agent can automatically schedule appointments based on your availability.',
    category: 'Integrations'
  },
  {
    id: 5,
    question: 'How do I invite team members?',
    answer: 'Go to Team page and click "Invite Member". Enter their email address, select their role (Admin or Member), and send the invitation. They will receive an email with instructions to join your team.',
    category: 'Team Management'
  },
  {
    id: 6,
    question: 'What analytics are available?',
    answer: 'The Analytics page provides detailed insights including total calls, success rates, call duration, sentiment analysis, and conversation history. You can filter by date range and export reports.',
    category: 'Analytics'
  }
];

export default function HelpPage() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-h1 text-slate-900 mb-4">
          How can we help you?
        </h1>
        <p className="text-body text-slate-600 mb-6">
          Find answers to common questions or reach out to our support team
        </p>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-body focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl group-hover:scale-110 transition-transform">
              <Book className="w-6 h-6 text-primary-600" />
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
          </div>
          <h3 className="text-body font-semibold text-slate-900 mb-2">Documentation</h3>
          <p className="text-body-sm text-slate-600">
            Comprehensive guides and tutorials to get you started
          </p>
        </div>

        <div className="card hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="text-body font-semibold text-slate-900 mb-2">Video Tutorials</h3>
          <p className="text-body-sm text-slate-600">
            Watch step-by-step video guides to master Vami
          </p>
        </div>

        <div className="card hover:shadow-lg transition-all duration-200 cursor-pointer group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-body font-semibold text-slate-900 mb-2">Community Forum</h3>
          <p className="text-body-sm text-slate-600">
            Connect with other users and share best practices
          </p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-h2 text-slate-900">Frequently Asked Questions</h2>
          <p className="text-body-sm text-slate-600 mt-1">
            Quick answers to common questions
          </p>
        </div>

        <div className="space-y-3">
          {filteredFAQs.map((faq) => (
            <div
              key={faq.id}
              className="border border-slate-200 rounded-xl overflow-hidden hover:border-primary-600 transition-colors"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1">
                  <span className="inline-block px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg mb-2">
                    {faq.category}
                  </span>
                  <h3 className="text-body font-semibold text-slate-900">
                    {faq.question}
                  </h3>
                </div>
                {expandedFAQ === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-600 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-600 flex-shrink-0 ml-4" />
                )}
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-4 pt-2">
                  <p className="text-body-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-body text-slate-600">No FAQs found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-h2 text-slate-900">Still need help?</h2>
          <p className="text-body-sm text-slate-600 mt-1">
            Contact our support team and we'll get back to you as soon as possible
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-body font-semibold text-slate-900 mb-2">Email Support</h3>
            <p className="text-body-sm text-slate-600 mb-4">
              Get help via email within 24 hours
            </p>
            <a
              href="mailto:support@vami.ai"
              className="text-body-sm text-primary-600 font-semibold hover:text-primary-700"
            >
              support@vami.ai
            </a>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-body font-semibold text-slate-900 mb-2">Live Chat</h3>
            <p className="text-body-sm text-slate-600 mb-4">
              Chat with our team in real-time
            </p>
            <button className="text-body-sm text-blue-600 font-semibold hover:text-blue-700">
              Start Chat
            </button>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-body font-semibold text-slate-900 mb-2">Phone Support</h3>
            <p className="text-body-sm text-slate-600 mb-4">
              Call us Monday-Friday, 9am-5pm EST
            </p>
            <a
              href="tel:+1-800-VAMI-HELP"
              className="text-body-sm text-purple-600 font-semibold hover:text-purple-700"
            >
              +1 (800) VAMI-HELP
            </a>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-body font-semibold text-slate-900 mb-4">Popular Resources</h3>
          <div className="space-y-3">
            {[
              'Getting Started Guide',
              'API Documentation',
              'Integration Guides',
              'Best Practices',
              'Security & Privacy'
            ].map((resource, index) => (
              <a
                key={index}
                href="#"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-body-sm text-slate-700 group-hover:text-primary-600 transition-colors">
                    {resource}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-body font-semibold text-slate-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-body-sm font-semibold text-green-900">All Systems Operational</p>
                  <p className="text-caption text-green-700">Last checked: Just now</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { name: 'API', status: 'operational' },
                { name: 'Voice Services', status: 'operational' },
                { name: 'Dashboard', status: 'operational' },
                { name: 'Analytics', status: 'operational' }
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-body-sm text-slate-700">{service.name}</span>
                  <span className="badge badge-success">Operational</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
