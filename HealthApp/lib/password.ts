import { randomBytes, pbkdf2 } from "crypto"
import { promisify } from "util"

const pbkdf2Async = promisify(pbkdf2)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const hash = await pbkdf2Async(password, salt, 1000, 64, "sha512")
  return `${salt}:${hash.toString("hex")}`
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, originalHash] = hashedPassword.split(":")
  const hash = await pbkdf2Async(password, salt, 1000, 64, "sha512")
  return hash.toString("hex") === originalHash
}
