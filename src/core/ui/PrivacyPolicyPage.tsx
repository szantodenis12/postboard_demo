import React from 'react'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Database, 
  Share2, 
  Lock, 
  UserCheck, 
  Mail,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

const PrivacyPolicyPage: React.FC = () => {
  const currentDate = "03/04/2026"

  const sections = [
    {
      title: "1. Information We Collect",
      icon: <Database className="w-5 h-5 text-accent-violet" />,
      content: (
        <div className="space-y-4">
          <p>We collect information that you provide directly to us or that we receive through authorized third-party integrations:</p>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li><span className="text-white font-medium">Account Information:</span> Your name, email address, password, and profile picture provided during registration or through Google/Meta authentication.</li>
            <li><span className="text-white font-medium">Connected Assets Data:</span> Information from your connected Facebook Pages, Instagram Business accounts, and Google Business Profiles, including page names, IDs, access tokens, and provided content.</li>
            <li><span className="text-white font-medium">Content Data:</span> Text, images, videos, captions, and hashtags you upload or generate through our platform for scheduling or publishing.</li>
            <li><span className="text-white font-medium">Usage Data:</span> IP address, browser type, operating system, and statistics about how you interact with Postboard features.</li>
          </ul>
        </div>
      )
    },
    {
      title: "2. How We Use Your Information",
      icon: <ShieldCheck className="w-5 h-5 text-accent-violet" />,
      content: (
        <div className="space-y-4">
          <p>Your data is processed based on the necessity to perform our contract with you and our legitimate interests in providing a secure service:</p>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li>To facilitate the scheduling and publishing of content to your social media accounts.</li>
            <li>To provide AI-powered content generation and optimization features (using sub-processors like Anthropic).</li>
            <li>To generate performance analytics and insights reports for your connected social pages.</li>
            <li>To ensure the security of your account and prevent fraudulent activities.</li>
            <li>To communicate with you regarding service updates, technical notices, and support requests.</li>
          </ul>
        </div>
      )
    },
    {
      title: "3. Data Sharing & Sub-processors",
      icon: <Share2 className="w-5 h-5 text-accent-violet" />,
      content: (
        <div className="space-y-4">
          <p>We do not sell your personal data. We only share information with third parties necessary for the operation of the service:</p>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li><span className="text-white font-medium">Meta Platforms, Inc.:</span> To publish content and sync insights via Facebook and Instagram APIs.</li>
            <li><span className="text-white font-medium">Google LLC:</span> For authentication and publishing to Google Business Profiles.</li>
            <li><span className="text-white font-medium">Anthropic, PBC:</span> For processing text prompts to generate AI captions and content ideas.</li>
            <li><span className="text-white font-medium">Firebase (Google Cloud):</span> For secure database hosting, authentication services, and media storage.</li>
          </ul>
        </div>
      )
    },
    {
      title: "4. Data Retention & Deletion",
      icon: <Lock className="w-5 h-5 text-accent-violet" />,
      content: (
        <div className="space-y-4">
          <p>We retain your information as long as your account is active. You have the right to request deletion at any time:</p>
          <p className="text-white/70">When you delete your account, we initiate the removal of all personal data and social platform tokens from our active databases. For Meta-specific data deletion, please refer to our dedicated <a href="/meta-data-deletion" className="text-accent-violet hover:underline">Meta Data Deletion Request</a> page.</p>
        </div>
      )
    },
    {
      title: "5. Your Rights (GDPR)",
      icon: <UserCheck className="w-5 h-5 text-accent-violet" />,
      content: (
        <div className="space-y-4">
          <p>Under the General Data Protection Regulation (GDPR), you hold the following rights:</p>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li><span className="text-white font-medium">Access & Portability:</span> Request a copy of your personal data.</li>
            <li><span className="text-white font-medium">Rectification:</span> Correct inaccurate or incomplete data.</li>
            <li><span className="text-white font-medium">Erasure:</span> Request the "right to be forgotten."</li>
            <li><span className="text-white font-medium">Restriction:</span> Limit the processing of your data under specific conditions.</li>
          </ul>
        </div>
      )
    }
  ]

  return (
    <div className="h-screen bg-[#07070e] text-white/90 selection:bg-accent-violet/30 p-6 md:p-12 overflow-y-auto scroll-area">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </a>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-tr from-white via-white to-white/40 bg-clip-text text-transparent"
              >
                Privacy Policy
              </motion.h1>
              <p className="text-white/40 mt-2">Postboard by Epic Digital Hub — Last Updated: {currentDate}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 px-6 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-accent-violet/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-accent-violet" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-tighter text-white/30 font-bold">Status</div>
                <div className="text-sm font-medium text-emerald-400">Compliant & Active</div>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-2xl relative overflow-hidden mb-12">
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none noise" />
          
          <div className="space-y-12">
            <div>
              <p className="text-lg leading-relaxed text-white/80">
                At <span className="text-white font-semibold">Postboard by Epic Digital Hub</span>, we take your privacy seriously. This Policy outlines how Epic Digital Hub SRL (the "Controller") collects, uses, and protects your data when you use the Postboard platform.
              </p>
            </div>

            <div className="grid gap-10">
              {sections.map((section, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-accent-violet/30 transition-colors">
                      {section.icon}
                    </div>
                    <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                  </div>
                  <div className="pl-12 text-white/60 leading-relaxed text-base">
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/10 mt-12">
              <div className="flex flex-col md:flex-row gap-8 justify-between">
                <div className="space-y-4 max-w-sm">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-accent-violet" />
                    Contact & Legal
                  </h3>
                  <div className="text-sm text-white/50 leading-relaxed">
                    <p className="font-medium text-white/80">Epic Digital Hub SRL</p>
                    <p>Str. Nucetului nr. 24, bl. DE 4, ap 308</p>
                    <p>Oradea, Romania</p>
                    <p className="mt-2 flex items-center gap-2 text-accent-violet">
                      contact@epicdigitalhub.ro
                    </p>
                  </div>
                </div>
                
                <div className="bg-accent-violet/5 border border-accent-violet/10 rounded-2xl p-6 flex-1">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Security Statement</p>
                  <p className="text-sm text-white/70 leading-relaxed italic">
                    "We implement industry-standard encryption and security protocols to ensure that your social media access tokens and personal data remain protected at all times. Our systems are regularly audited for compliance with Meta and Google security standards."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-12 text-center text-white/20 text-[10px] tracking-widest uppercase font-medium">
          © 2026 Epic Digital Hub SRL. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
