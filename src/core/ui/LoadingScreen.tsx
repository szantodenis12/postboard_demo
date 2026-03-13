import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-surface noise">
      <div className="animated-bg">
        <div className="orb" />
        <div className="orb" />
        <div className="orb" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center mx-auto mb-6"
        >
          <Zap size={28} className="text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-xl font-bold gradient-text mb-2">PostBoard</h1>
          <p className="text-sm text-white/30">Scanning your content files...</p>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 200 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="h-0.5 bg-gradient-to-r from-accent-violet to-accent-cyan rounded-full mt-6 mx-auto"
        />
      </motion.div>
    </div>
  )
}
