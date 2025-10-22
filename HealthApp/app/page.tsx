"use client"

import { useRouter } from "next/navigation"
import styles from "./home.module.css"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className={styles.homePage}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>H+</div>
            <div className={styles.logoText}>Carenet360</div>
          </div>
          <nav className={styles.nav}>
            <button className={styles.navLink} onClick={() => router.push("/auth/login")}>
              Sign In
            </button>
            <button className={styles.navButton} onClick={() => router.push("/auth/register")}>
              Get Started
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Your Health, <span className={styles.heroHighlight}>Our Priority</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Modern healthcare management system connecting patients, doctors, and healthcare providers in one
                seamless platform.
              </p>
              <div className={styles.heroActions}>
                <button className={styles.heroPrimary} onClick={() => router.push("/auth/register")}>
                  Register Now
                </button>
                <button className={styles.heroSecondary} onClick={() => router.push("/auth/login")}>
                  Sign In
                </button>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div className={styles.heroCard}>
                <div className={styles.heroCardIcon}>🏥</div>
                <div className={styles.heroCardTitle}>24/7 Healthcare</div>
                <div className={styles.heroCardText}>Access medical services anytime, anywhere</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className={styles.featuresContainer}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Comprehensive Healthcare Solutions</h2>
              <p className={styles.sectionSubtitle}>Everything you need for modern healthcare management</p>
            </div>

            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>👨‍⚕️</div>
                <h3 className={styles.featureTitle}>Expert Doctors</h3>
                <p className={styles.featureText}>
                  Connect with qualified healthcare professionals across multiple specializations
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📅</div>
                <h3 className={styles.featureTitle}>Easy Appointments</h3>
                <p className={styles.featureText}>Book, manage, and track your medical appointments effortlessly</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📱</div>
                <h3 className={styles.featureTitle}>Digital Health Card</h3>
                <p className={styles.featureText}>
                  QR-based health records accessible instantly by healthcare providers
                </p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💊</div>
                <h3 className={styles.featureTitle}>Pharmacy Integration</h3>
                <p className={styles.featureText}>Digital prescriptions and medicine tracking in one place</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💳</div>
                <h3 className={styles.featureTitle}>Secure Payments</h3>
                <p className={styles.featureText}>Multiple payment options with complete transaction security</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📊</div>
                <h3 className={styles.featureTitle}>Health Analytics</h3>
                <p className={styles.featureText}>Track your health journey with comprehensive reports and insights</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className={styles.ctaContainer}>
            <h2 className={styles.ctaTitle}>Ready to Transform Your Healthcare Experience?</h2>
            <p className={styles.ctaSubtitle}>Join thousands of patients and healthcare providers on our platform</p>
            <button className={styles.ctaButton} onClick={() => router.push("/auth/register")}>
              Get Started Today
            </button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <div className={styles.logoIcon}>H+</div>
                <div className={styles.logoText}>Carenet360</div>
              </div>
              <p className={styles.footerText}>Modern healthcare management for everyone</p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerHeading}>Platform</h4>
                <a className={styles.footerLink}>For Patients</a>
                <a className={styles.footerLink}>For Doctors</a>
                <a className={styles.footerLink}>For Hospitals</a>
              </div>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerHeading}>Support</h4>
                <a className={styles.footerLink}>Help Center</a>
                <a className={styles.footerLink}>Contact Us</a>
                <a className={styles.footerLink}>Privacy Policy</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2025 HealthCare System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
