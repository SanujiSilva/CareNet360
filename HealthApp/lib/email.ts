import nodemailer from "nodemailer"

interface ChangeMap {
  [key: string]: { from: any; to: any }
}

export async function sendProfileChangeEmail(to: string, changes: ChangeMap) {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM || `no-reply@${host || "localhost"}`

  if (!host || !user || !pass) {
    console.warn("SMTP not configured, skipping sending email")
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  const changeList = Object.entries(changes)
    .map(([k, v]) => `- ${k}: ${v.from ?? "(empty)"} -> ${v.to ?? "(empty)"}`)
    .join("\n")

  const subject = "Your profile was updated"
  const text = `We noticed changes to your profile:\n\n${changeList}\n\nIf you did not make these changes, please contact support.`

  await transporter.sendMail({ from, to, subject, text })
}
