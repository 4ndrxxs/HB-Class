import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join } from 'path'

const SOURCE = 'public/logo.png'
const ANDROID_RES = 'android/app/src/main/res'

// Android adaptive icon sizes (foreground layer)
const ANDROID_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
}

// Android legacy launcher icon sizes
const LEGACY_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

// Web rounded logo
const WEB_SIZE = 512
const CORNER_RADIUS_RATIO = 0.22 // 22% of width = nice iOS-like rounding

async function generateRoundedIcon(inputPath, outputPath, size) {
  const roundedCorners = Buffer.from(
    `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * CORNER_RADIUS_RATIO)}" ry="${Math.round(size * CORNER_RADIUS_RATIO)}"/></svg>`
  )

  await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: roundedCorners, blend: 'dest-in' }])
    .png()
    .toFile(outputPath)
}

async function main() {
  // 1. Rounded web logo
  console.log('Generating rounded web logo...')
  await generateRoundedIcon(SOURCE, 'public/logo-rounded.png', WEB_SIZE)
  console.log('  -> public/logo-rounded.png (512x512)')

  // 2. Favicon (32x32 rounded)
  await generateRoundedIcon(SOURCE, 'public/favicon.png', 32)
  console.log('  -> public/favicon.png (32x32)')

  // 3. PWA icon (192)
  await generateRoundedIcon(SOURCE, 'public/logo-192.png', 192)
  console.log('  -> public/logo-192.png (192x192)')

  // 4. Android adaptive icon foreground
  console.log('Generating Android icons...')
  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const dir = join(ANDROID_RES, folder)
    mkdirSync(dir, { recursive: true })

    // Foreground: logo centered on transparent bg with padding
    const padding = Math.round(size * 0.2)
    const logoSize = size - padding * 2

    const resizedLogo = await sharp(SOURCE)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{ input: resizedLogo, gravity: 'centre' }])
      .png()
      .toFile(join(dir, 'ic_launcher_foreground.png'))

    console.log(`  -> ${folder}/ic_launcher_foreground.png (${size}x${size})`)
  }

  // 5. Android legacy launcher icons (ic_launcher.png + ic_launcher_round.png)
  console.log('Generating legacy Android launcher icons...')
  for (const [folder, size] of Object.entries(LEGACY_SIZES)) {
    const dir = join(ANDROID_RES, folder)
    mkdirSync(dir, { recursive: true })

    // Square icon with rounded corners
    await generateRoundedIcon(SOURCE, join(dir, 'ic_launcher.png'), size)
    console.log(`  -> ${folder}/ic_launcher.png (${size}x${size})`)

    // Round icon (circular mask)
    const circularMask = Buffer.from(
      `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`
    )
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover' })
      .composite([{ input: circularMask, blend: 'dest-in' }])
      .png()
      .toFile(join(dir, 'ic_launcher_round.png'))
    console.log(`  -> ${folder}/ic_launcher_round.png (${size}x${size})`)
  }

  // 6. Splash screens (logo centered on white background)
  console.log('Generating splash screens...')
  const splashSizes = {
    'drawable': [480, 320],
    'drawable-port-mdpi': [320, 480],
    'drawable-port-hdpi': [480, 800],
    'drawable-port-xhdpi': [720, 1280],
    'drawable-port-xxhdpi': [960, 1600],
    'drawable-port-xxxhdpi': [1280, 1920],
    'drawable-land-mdpi': [480, 320],
    'drawable-land-hdpi': [800, 480],
    'drawable-land-xhdpi': [1280, 720],
    'drawable-land-xxhdpi': [1600, 960],
    'drawable-land-xxxhdpi': [1920, 1280],
  }

  for (const [folder, [w, h]] of Object.entries(splashSizes)) {
    const dir = join(ANDROID_RES, folder)
    mkdirSync(dir, { recursive: true })

    const logoSize = Math.round(Math.min(w, h) * 0.3)
    const resizedLogo = await sharp(SOURCE)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer()

    await sharp({
      create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([{ input: resizedLogo, gravity: 'centre' }])
      .png()
      .toFile(join(dir, 'splash.png'))

    console.log(`  -> ${folder}/splash.png (${w}x${h})`)
  }

  console.log('Done!')
}

main().catch(console.error)
