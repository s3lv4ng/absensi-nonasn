'use client'

import { useAuthStore, useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Fingerprint,
  MapPin,
  Activity,
  ArrowRight,
  Shield,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
}

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const features = [
  {
    icon: Fingerprint,
    title: 'Face Recognition',
    description: 'Verifikasi kehadiran dengan teknologi pengenalan wajah untuk akurasi dan keamanan tinggi.',
    gradient: 'from-blue-600 to-blue-400',
    shadowColor: 'shadow-blue-500/20',
  },
  {
    icon: MapPin,
    title: 'GPS Validation',
    description: 'Validasi lokasi absensi dengan GPS tracking untuk memastikan kehadiran di area kantor.',
    gradient: 'from-emerald-600 to-teal-400',
    shadowColor: 'shadow-emerald-500/20',
  },
  {
    icon: Activity,
    title: 'Real-time Monitoring',
    description: 'Pantau kehadiran pegawai secara real-time dengan dashboard interaktif dan notifikasi.',
    gradient: 'from-violet-600 to-purple-400',
    shadowColor: 'shadow-violet-500/20',
  },
]

const stats = [
  { value: '99.7%', label: 'Akurasi Pengenalan' },
  { value: '<2detik', label: 'Waktu Verifikasi' },
  { value: '24/7', label: 'Monitoring Aktif' },
]

const benefits = [
  { icon: Shield, text: 'Keamanan berlapis dengan JWT & enkripsi data' },
  { icon: Clock, text: 'Toleransi keterlambatan yang dapat dikonfigurasi' },
  { icon: Users, text: 'Manajemen pegawai dan unit kerja terintegrasi' },
  { icon: CheckCircle2, text: 'Persetujuan izin & cuti secara digital' },
]

export function LandingPage() {
  const { setCurrentView, appIdentity } = useAppStore()
  const { login } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-4 sm:p-6"
      >
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-[#1e40af] to-[#2563eb] text-white shadow-lg shadow-blue-500/25 overflow-hidden">
              {appIdentity.logoPath ? (
                <img src={appIdentity.logoPath} alt="Logo" className="size-9 object-contain rounded-xl" />
              ) : (
                <Fingerprint className="size-5" />
              )}
            </div>
            <div>
              <span className="font-bold text-lg text-[#1e3a8a] dark:text-blue-300">{appIdentity.appName.split(' ').slice(0, 2).join(' ')}</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-1.5">v2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('login')}
              className="text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              Masuk
            </Button>
            <Button
              onClick={() => setCurrentView('register')}
              className="bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1e3a8a] hover:to-[#1e40af] text-white shadow-lg shadow-blue-500/25"
            >
              Daftar
            </Button>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left - Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div variants={fadeIn} initial="hidden" animate="visible">
                  <Badge className="inline-flex items-center gap-1.5 rounded-full bg-[#1e40af]/10 dark:bg-blue-900/30 px-4 py-1.5 text-sm text-[#1e40af] dark:text-blue-300 border border-[#1e40af]/20 dark:border-blue-800/30 mb-6">
                    <Fingerprint className="size-3.5" />
                    Sistem Absensi Digital
                  </Badge>
                </motion.div>

                <motion.h1
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1e3a8a] dark:text-blue-200 leading-tight mb-6"
                >
                  Sistem Absensi
                  <br />
                  <span className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-blue-400 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
                    Pegawai Modern
                  </span>
                </motion.h1>

                <motion.p
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.15 }}
                  className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
                >
                  Kelola kehadiran pegawai dengan teknologi pengenalan wajah dan GPS tracking.
                  Akurat, aman, dan mudah digunakan untuk instansi pemerintah maupun swasta.
                </motion.p>

                <motion.div
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
                >
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('login')}
                    className="bg-gradient-to-r from-[#1e40af] to-[#2563eb] hover:from-[#1e3a8a] hover:to-[#1e40af] text-white shadow-xl shadow-blue-500/25 px-8 h-12 text-base"
                  >
                    Masuk Sekarang
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setCurrentView('register')}
                    className="border-[#1e40af]/20 text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-12 text-base"
                  >
                    Buat Akun
                    <ChevronRight className="ml-1 size-4" />
                  </Button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-center lg:justify-start gap-6 sm:gap-8 mt-10 pt-8 border-t border-blue-100/50 dark:border-blue-900/30"
                >
                  {stats.map((stat) => (
                    <motion.div key={stat.label} variants={staggerItem} className="text-center lg:text-left">
                      <p className="text-xl sm:text-2xl font-bold text-[#1e40af] dark:text-blue-400">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Right - Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                className="flex-1 w-full max-w-lg"
              >
                <div className="relative">
                  {/* Main Card */}
                  <div className="bg-gradient-to-br from-[#1e40af] to-[#2563eb] rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-blue-500/30">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Fingerprint className="size-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Dashboard Absensi</p>
                        <p className="text-xs text-blue-200">Hari ini</p>
                      </div>
                      <Badge className="ml-auto bg-white/20 text-white border-0 text-xs">Live</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { label: 'Hadir', value: '42', color: 'bg-white/20' },
                        { label: 'Terlambat', value: '3', color: 'bg-amber-400/20' },
                        { label: 'Izin', value: '2', color: 'bg-blue-300/20' },
                        { label: 'Alpha', value: '1', color: 'bg-red-400/20' },
                      ].map((item) => (
                        <div key={item.label} className={`${item.color} rounded-xl p-3`}>
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-xs text-blue-200">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Simulated attendance list */}
                    <div className="space-y-2">
                      {[
                        { name: 'Ahmad Fauzi', time: '07:45', status: 'Hadir' },
                        { name: 'Siti Rahmawati', time: '07:52', status: 'Hadir' },
                        { name: 'Budi Santoso', time: '08:15', status: 'Terlambat' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                              {item.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="text-xs font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-blue-200">{item.time}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.status === 'Hadir' ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating decoration elements */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e40af]/10 to-[#2563eb]/10 dark:from-blue-500/10 dark:to-blue-400/10 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 flex items-center justify-center shadow-lg">
                    <MapPin className="size-8 text-[#1e40af] dark:text-blue-400" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-400/10 backdrop-blur-sm border border-white/50 dark:border-gray-700/50 flex items-center justify-center shadow-lg">
                    <Shield className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="px-4 sm:px-6 py-16 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <motion.div
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] dark:text-blue-200 mb-3">
                Fitur Unggulan
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Teknologi terdepan untuk mengelola kehadiran pegawai secara efisien dan akurat
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {features.map((feature) => (
                <motion.div key={feature.title} variants={staggerItem}>
                  <Card className="group bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 h-full">
                    <CardHeader className="pb-3">
                      <div className={`size-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="size-6 text-white" />
                      </div>
                      <CardTitle className="text-base text-[#1e3a8a] dark:text-blue-300 group-hover:text-[#2563eb] dark:group-hover:text-blue-200 transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1e3a8a] dark:text-blue-200 mb-3">
                Mengapa Memilih Kami?
              </h2>
              <p className="text-muted-foreground">
                Solusi absensi yang dirancang khusus untuk kebutuhan instansi
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit.text}
                  variants={staggerItem}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-blue-100/30 dark:border-blue-900/20 hover:border-[#1e40af]/30 dark:hover:border-blue-700/30 transition-colors"
                >
                  <div className="size-10 shrink-0 rounded-xl bg-[#1e40af]/10 dark:bg-blue-900/30 flex items-center justify-center">
                    <benefit.icon className="size-5 text-[#1e40af] dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-2">{benefit.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="px-4 sm:px-6 py-16"
        >
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#1e40af] to-[#2563eb] rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/5 blur-2xl" />
              </div>

              <div className="relative z-10">
                <Fingerprint className="size-12 mx-auto mb-4 text-blue-200" />
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  Mulai Kelola Kehadiran Sekarang
                </h2>
                <p className="text-blue-200 max-w-lg mx-auto mb-8">
                  Daftar gratis dan mulai kelola kehadiran pegawai dengan teknologi modern. Tanpa kartu, tanpa antrian.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('register')}
                    className="bg-white text-[#1e40af] hover:bg-blue-50 shadow-xl h-12 text-base px-8"
                  >
                    Daftar Sekarang
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setCurrentView('login')}
                    className="border-white/30 text-white hover:bg-white/10 h-12 text-base"
                  >
                    Sudah Punya Akun
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Quick Demo */}
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-md mx-auto">
            <motion.div
              variants={slideUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-xs text-muted-foreground mb-4">Atau coba demo cepat:</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    login({
                      id: '1',
                      nip: '12345',
                      nama: 'Admin Demo',
                      email: 'admin@demo.com',
                      role: 'ADMIN',
                      photo: null,
                      faceDescriptor: null,
                      unitKerja: 'IT',
                      jabatan: 'Administrator',
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    })
                    useAppStore.getState().setCurrentView('admin-dashboard')
                  }}
                  className="border-[#1e40af]/20 text-[#1e40af] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                >
                  <Shield className="size-3.5 mr-1" />
                  Login Admin
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    login({
                      id: '2',
                      nip: '67890',
                      nama: 'Pegawai Demo',
                      email: 'pegawai@demo.com',
                      role: 'PEGAWAI',
                      photo: null,
                      faceDescriptor: null,
                      unitKerja: 'Keuangan',
                      jabatan: 'Staff',
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    })
                    useAppStore.getState().setCurrentView('employee-dashboard')
                  }}
                  className="border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  <Users className="size-3.5 mr-1" />
                  Login Pegawai
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="p-4 sm:p-6 text-center border-t border-blue-100/50 dark:border-blue-900/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-gradient-to-br from-[#1e40af] to-[#2563eb] flex items-center justify-center text-white overflow-hidden">
              {appIdentity.logoPath ? (
                <img src={appIdentity.logoPath} alt="Logo" className="size-6 object-contain rounded-lg" />
              ) : (
                <Fingerprint className="size-3.5" />
              )}
            </div>
            <span className="text-sm font-medium text-[#1e3a8a] dark:text-blue-300">{appIdentity.appName.split(' ').slice(0, 2).join(' ')}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {appIdentity.appName}. Hak Cipta Dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
