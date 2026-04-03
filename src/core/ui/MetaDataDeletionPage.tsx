import { motion } from 'framer-motion'
import { ArrowLeft, Mail, ShieldCheck, Trash2, Facebook, Info } from 'lucide-react'

export function MetaDataDeletionPage() {
  const handleBack = () => {
    window.location.href = '/'
  }

  return (
    <div className="h-screen bg-[#07070e] text-white/90 selection:bg-accent-violet/30 p-6 md:p-12 overflow-y-auto scroll-area">
      {/* Animated background (replicated from App for consistency) */}
      <div className="animated-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">PostBoard</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="glass rounded-3xl p-8 md:p-12 border border-white/[0.06] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-violet opacity-50" />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">
            Meta Data Deletion Request for Postboard
          </h1>

          <div className="space-y-8 text-white/60 leading-relaxed text-sm md:text-base">
            <p className="text-white/80 font-medium">
              If you have connected your Facebook or Instagram accounts to Postboard by Epic Digital Hub and want us to delete data that we receive from Meta, you can use the process on this page.
            </p>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Info size={18} className="text-accent-cyan" />
                Who is this policy applicable for?
              </h2>
              <p>This page is for you if any of the following are true:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-accent-violet">
                <li>You created a Postboard by Epic Digital Hub account and authenticated your Facebook credentials.</li>
                <li>You connected a Facebook page, Instagram account, Business Manager, or ad account to Postboard by Epic Digital Hub.</li>
                <li>You no longer want Postboard by Epic Digital Hub to store data that we receive from Meta.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trash2 size={18} className="text-red-400" />
                How to request deletion of your Meta data?
              </h2>
              <p>To request deletion of Meta related data from Postboard by Epic Digital Hub, please follow these steps.</p>
              
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent-violet/20 text-accent-violet flex items-center justify-center text-xs">1</span>
                  Send us an email
                </h3>
                <p>Write to our support team at: <a href="mailto:contact@epicdigitalhub.ro" className="text-accent-cyan hover:underline">contact@epicdigitalhub.ro</a></p>
                
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/30">Please include these details:</p>
                  <ul className="space-y-2 text-sm bg-black/20 p-4 rounded-xl border border-white/[0.04]">
                    <li className="flex gap-3"><span className="text-accent-violet font-bold">•</span> <span><strong>Subject line:</strong> Meta data deletion request</span></li>
                    <li className="flex gap-3"><span className="text-accent-violet font-bold">•</span> <span>Your full name</span></li>
                    <li className="flex gap-3"><span className="text-accent-violet font-bold">•</span> <span>The email address you use for your Postboard by Epic Digital Hub account</span></li>
                    <li className="flex gap-3"><span className="text-accent-violet font-bold">•</span> <span>A clear line that you want Postboard by Epic Digital Hub to delete data received from Meta</span></li>
                    <li className="flex gap-3"><span className="text-accent-violet font-bold">•</span> <span className="text-white/40 italic text-xs">If you did not connect an email address with your Facebook account or you cannot access it, include your Facebook profile link or your Facebook ID so that we can locate your account.</span></li>
                  </ul>
                </div>

                <h3 className="font-medium text-white flex items-center gap-2 pt-4">
                  <span className="w-6 h-6 rounded-full bg-accent-violet/20 text-accent-violet flex items-center justify-center text-xs">2</span>
                  Processing your request
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>We will confirm that we received your request on the same email thread.</li>
                  <li>Within 21 days from the date we receive your email, the Postboard by Epic Digital Hub team will delete your Meta related data from our active systems.</li>
                  <li>If we need extra information to verify your identity or to locate your account, we will contact you at the same email address.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-status-published" />
                What data we delete?
              </h2>
              <p>When you send a valid Meta data deletion request, Postboard by Epic Digital Hub will delete:</p>
              <ul className="list-disc pl-5 space-y-2 decoration-accent-cyan">
                <li>Data that we received from Meta when you connected your Facebook or Instagram assets to Postboard by Epic Digital Hub.</li>
                <li>Related insights and metrics in our active systems that depend on that Meta data.</li>
              </ul>
              <p className="text-xs italic bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                We may keep limited records that are required for legal, regulatory, security, or billing purposes. These records are not used for analytics or product features.
              </p>
            </section>

            <section className="space-y-4 pt-4 border-t border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Facebook size={18} className="text-blue-500" />
                Removing Postboard from your Facebook settings
              </h2>
              <p>
                You can also manage connected apps in your Facebook settings. Removing Postboard by Epic Digital Hub there will stop future data sharing between Meta and Postboard by Epic Digital Hub.
              </p>
              <p>
                However, removing Postboard by Epic Digital Hub in Facebook settings does not automatically delete data that Postboard by Epic Digital Hub has already stored. To delete stored Meta data from Postboard by Epic Digital Hub, you still need to follow the email process described above.
              </p>
            </section>

            <section className="bg-gradient-to-br from-accent-violet/10 to-accent-cyan/10 rounded-2xl p-6 border border-white/[0.06] mt-8">
              <h2 className="text-lg font-bold text-white mb-2">Contact</h2>
              <p>If you have questions about this process or want to check the status of your request, please contact:</p>
              <a href="mailto:contact@epicdigitalhub.ro" className="text-accent-cyan font-bold hover:underline block mt-2">
                contact@epicdigitalhub.ro
              </a>
            </section>
          </div>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-12 mb-8">
          © {new Date().getFullYear()} PostBoard — Epic Digital Hub. All rights reserved.
        </p>
      </motion.div>
    </div>
  )
}
