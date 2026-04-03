import React from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Scale, 
  ShieldAlert, 
  CreditCard, 
  UserPlus,
  ArrowLeft,
  Gavel,
  Clock
} from 'lucide-react'

const TermsOfServicePage: React.FC = () => {
  const lastUpdated = "03/04/2026"

  const sections = [
    {
      id: "relationship",
      title: "1. Your relationship with Postboard",
      icon: <UserPlus className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4">
          <p>
            1.1 Your use of Postboard's products, services, content and web sites (referred to collectively as the “Service” or “Services”) is subject to the terms of a legal agreement between you and Epic Digital Hub SRL (as defined below in Section 18.1). The Services are accessed through our proprietary software application(s) (the “Software”) hosted on our platform and consist in a single log-in, centralised web dashboard that enables you to access data, metrics and analytics from social profiles on multiple social networks.
          </p>
          <p>
            1.2 The Services are provided as “Software as a Service (SaaS)” subscription services. We will not be delivering copies of the Software to you.
          </p>
          <p>
            1.3 Your agreement with Postboard will always include, at a minimum, the terms and conditions set out in this document (the “Universal Terms”).
          </p>
        </div>
      )
    },
    {
      id: "acceptance",
      title: "2. Accepting the Terms",
      icon: <ShieldAlert className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4">
          <p>
            2.1 In order to use the Services, you must firstly agree to the Terms. You can accept the Terms by (A) clicking to accept or agree where this option is made available; (B) by payment for the Services; or (C) by actually using the Services.
          </p>
          <p>
            2.2 You may not use the Services if you are not of legal age to form a binding contract or if you are not authorized to legally bind your company or organization.
          </p>
        </div>
      )
    },
    {
      id: "provision",
      title: "4. Provision of the Services",
      icon: <FileText className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4">
          <p>
            4.1 Postboard is constantly innovating. You acknowledge and agree that the form and nature of the Services may change from time to time without prior notice.
          </p>
          <p>
            4.2 We reserve the right to disable access to your account for non-payment or material breach of the Terms. In such cases, you may be prevented from accessing your account details or files.
          </p>
        </div>
      )
    },
    {
      id: "payments",
      title: "Payment & Subscription",
      icon: <CreditCard className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4">
          <p>
            Payment for Services is processed periodically based on your chosen subscription plan. We are not responsible for payment processing provided by third parties. Each party is responsible for its own taxes in connection with the Services.
          </p>
        </div>
      )
    },
    {
      id: "proprietary",
      title: "9. Proprietary Rights",
      icon: <Scale className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4">
          <p>
            Epic Digital Hub SRL (or its licensors) owns all legal rights, title and interest in and to the Services, including any intellectual property rights. You agree not to remove, obscure, or alter any proprietary rights notices affixed to the Services.
          </p>
        </div>
      )
    },
    {
      id: "liability",
      title: "14. Limitation of Liability",
      icon: <Gavel className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4 font-medium text-white/90">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EPIC DIGITAL HUB SRL WILL NOT BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS OR LOSS OF DATA, ARISING OUT OF OR IN CONNECTION WITH THE USE OF OUR SERVICES.
          </p>
        </div>
      )
    },
    {
      id: "legal",
      title: "18. General Legal Terms",
      icon: <Gavel className="w-5 h-5 text-accent-cyan" />,
      content: (
        <div className="space-y-4">
          <p>
            18.1 “Postboard” or “we” means Epic Digital Hub SRL, with its principal place of business at Str. Nucetului nr. 24, bl. DE 4, ap 308, Oradea, Romania.
          </p>
          <p>
            18.7 The Terms and your relationship with Postboard shall be governed by Romanian law. You agree to submit to the jurisdiction of the courts of Romania to resolve any legal matters arising from the Terms.
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="h-screen bg-[#07070e] text-white/80 selection:bg-accent-cyan/30 p-6 md:p-12 overflow-y-auto scroll-area">
      {/* Animated background */}
      <div className="animated-bg">
        <div className="orb !bg-accent-cyan/20" />
        <div className="orb !bg-accent-violet/20" />
        <div className="orb !bg-accent-cyan/10" />
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
                Terms of Service
              </motion.h1>
              <div className="flex items-center gap-2 text-white/40 mt-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Postboard by Epic Digital Hub — Last Updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
        </header>

        <section className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-2xl relative overflow-hidden mb-12">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none noise" />
          
          <div className="space-y-12">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-white/70 italic border-l-2 border-accent-cyan pl-6">
                Please read these Terms and Conditions carefully before using our software-as-a-service platform. By accessing or using Postboard, you agree to be bound by these Universal Terms and all connected policies.
              </p>
            </div>

            <div className="grid gap-12">
              {sections.map((section, index) => (
                <motion.div 
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      {section.icon}
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-white tracking-tight">{section.title}</h2>
                      <div className="text-white/60 leading-relaxed space-y-4 text-sm md:text-base">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-12 border-t border-white/10 mt-16 scale-95 opacity-80">
              <div className="bg-black/20 rounded-2xl p-8 border border-white/5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-accent-cyan mb-4 text-center">Legal Disclaimer</h3>
                <p className="text-center text-xs leading-relaxed text-white/40">
                  Postboard is a product of Epic Digital Hub SRL. Usage of social network APIs (Meta, Google) is subject to their own respective terms. 
                  Users are responsible for compliance with platform-specific rules regarding automated interactions and data usage.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-12 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="text-white/20 text-[10px] tracking-widest uppercase font-bold">
              Postboard — Epic Digital Hub
            </div>
            <div className="flex items-center gap-4 text-xs text-white/30">
              <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <a href="/meta-data-deletion" className="hover:text-white transition-colors">Data Deletion</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default TermsOfServicePage
